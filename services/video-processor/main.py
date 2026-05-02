"""
OpenVision AI Video Processor Service

HTTP-based video processing service that:
- Accepts video upload requests
- Extracts frames using OpenCV
- Runs AWS Rekognition label detection
- Emits detection events to Kinesis
- Stores job status in DynamoDB
"""

import json
import boto3
import os
import cv2
import numpy as np
from datetime import datetime
from decimal import Decimal
import tempfile
import base64
import uuid
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="OpenVision Video Processor", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS clients
rekognition = boto3.client(
    "rekognition",
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)
kinesis = boto3.client(
    "kinesis",
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)
dynamodb = boto3.resource(
    "dynamodb",
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)
s3 = boto3.client(
    "s3",
    region_name=os.environ.get("AWS_REGION", "us-east-1")
)

TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "VideoProcessingJobs")
STREAM_NAME = os.environ.get("KINESIS_STREAM", "DetectionEvents")
BUCKET_NAME = os.environ.get("S3_BUCKET", "")

job_table = dynamodb.Table(TABLE_NAME)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "video-processor"}


@app.post("/process-video")
async def process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    camera_id: Optional[str] = None
):
    """
    Process a video file uploaded via HTTP.

    - Extracts frames at 1fps
    - Runs Rekognition label detection
    - Emits events to Kinesis
    - Stores job status in DynamoDB
    """
    job_id = f"job-{uuid.uuid4().hex[:12]}"

    # Validate file type
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format. Use mp4, avi, mov, or mkv"
        )

    # Save uploaded file to temp
    with tempfile.NamedTemporaryFile(
        suffix=".mp4", delete=False
    ) as tmp_file:
        tmp_path = tmp_file.name
        content = await file.read()
        tmp_file.write(content)

    try:
        # Generate camera_id if not provided
        if not camera_id:
            camera_id = f"camera-{uuid.uuid4().hex[:8]}"

        # Process video in background
        background_tasks.add_task(
            process_video_task, job_id, tmp_path, camera_id
        )

        return {
            "job_id": job_id,
            "camera_id": camera_id,
            "status": "PROCESSING",
            "message": "Video processing started"
        }

    except Exception as e:
        # Clean up temp file on error
        os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=str(e))


def process_video_task(job_id: str, video_path: str, camera_id: str):
    """
    Background task to process video.

    Extracts frames at 1fps, runs Rekognition, emits events to Kinesis.
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        update_job_status(job_id, "FAILED", error="Could not open video file")
        return

    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0

        print(f"Processing video: FPS={fps}, Frames={frame_count}, Duration={duration}s")

        # Calculate frame interval for 1fps extraction
        frame_interval = max(1, int(round(fps))) if fps > 0 else 1

        detection_events = []
        frame_idx = 0
        extracted_idx = 0
        base_timestamp = datetime.utcnow()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                frame_time = extracted_idx * 1.0
                timestamp = base_timestamp.isoformat()

                # Run Rekognition on frame
                labels = detect_labels(frame)

                if labels:
                    detection_event = {
                        "camera_id": camera_id,
                        "timestamp": timestamp,
                        "labels": labels,
                        "frame_time": frame_time,
                        "job_id": job_id,
                    }
                    detection_events.append(detection_event)

                extracted_idx += 1

            frame_idx += 1

        cap.release()

        # Emit events to Kinesis
        events_emitted = 0
        for event_data in detection_events:
            try:
                kinesis.put_record(
                    StreamName=STREAM_NAME,
                    Data=json.dumps(event_data),
                    PartitionKey=camera_id,
                )
                events_emitted += 1
            except Exception as e:
                print(f"Kinesis error: {e}")

        # Store processed video reference
        store_processed_video(
            job_id, camera_id, events_emitted, extracted_idx
        )

        print(f"Job {job_id}: Processed {extracted_idx} frames, emitted {events_emitted} events")

    except Exception as e:
        print(f"Processing error for job {job_id}: {e}")
        update_job_status(job_id, "FAILED", error=str(e))
    finally:
        # Clean up temp file
        os.unlink(video_path)


def detect_labels(frame):
    """Run Rekognition label detection on a frame."""
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    _, buffer = cv2.imencode(".jpg", frame_rgb)
    image_bytes = buffer.tobytes()

    try:
        response = rekognition.detect_labels(
            Image={"Bytes": image_bytes},
            MinConfidence=70,
        )

        labels = []
        for label in response.get("Labels", []):
            label_name = label["Name"]
            confidence = label["Confidence"]

            for instance in label.get("Instances", []):
                bb = instance.get("BoundingBox", {})
                labels.append({
                    "name": label_name,
                    "confidence": float(Decimal(str(confidence))),
                    "bounding_box": {
                        "width": float(Decimal(str(bb.get("Width", 0))),
                        "height": float(Decimal(str(bb.get("Height", 0))),
                        "left": float(Decimal(str(bb.get("Left", 0))),
                        "top": float(Decimal(str(bb.get("Top", 0))),
                    },
                })

        return labels

    except Exception as e:
        print(f"Rekognition error: {e}")
        return []


def store_processed_video(job_id: str, camera_id: str, events_emitted: int, frames_processed: int):
    """Store processed video reference in DynamoDB."""
    timestamp = datetime.utcnow().isoformat()

    try:
        job_table.put_item(Item={
            "job_id": job_id,
            "camera_id": camera_id,
            "status": "COMPLETED",
            "events_emitted": events_emitted,
            "frames_processed": frames_processed,
            "start_time": timestamp,
            "created_at": timestamp,
            "processing_mode": "http-api",
        })
    except Exception as e:
        print(f"Error storing job: {e}")


def update_job_status(job_id: str, status: str, error: str = None):
    """Update job status in DynamoDB."""
    try:
        update_expr = "SET #status = :status, updated_at = :updated_at"
        expr_values = {
            ":status": status,
            ":updated_at": datetime.utcnow().isoformat(),
        }

        if error:
            update_expr += ", error_message = :error"
            expr_values[":error"] = error

        job_table.update_item(
            Key={"job_id": job_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues=expr_values,
        )
    except Exception as e:
        print(f"Error updating job status: {e}")


@app.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a processing job."""
    try:
        response = job_table.get_item(Key={"job_id": job_id})
        item = response.get("Item")

        if not item:
            raise HTTPException(status_code=404, detail="Job not found")

        return item

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)