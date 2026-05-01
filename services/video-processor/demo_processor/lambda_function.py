import json
import boto3
import os
import cv2
import numpy as np
from datetime import datetime
from decimal import Decimal
import tempfile
import math

rekognition = boto3.client("rekognition")
s3 = boto3.client("s3")
kinesis = boto3.client("kinesis")
dynamodb = boto3.resource("dynamodb")

TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "VideoProcessingJobs")
STREAM_NAME = os.environ.get("KINESIS_STREAM", "DetectionEvents")

job_table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    """
    Handler for simulated live stream processing.

    Accept video file from S3, extract frames at 1fps using CV2,
    run Rekognition on each frame, and emit detection events.
    """
    print(f"Event: {json.dumps(event)}")

    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        if not key.startswith("videos/"):
            continue

        camera_id = extract_camera_id(key)
        video_s3_uri = f"s3://{bucket}/{key}"

        # Download video to temp file
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_file:
            tmp_path = tmp_file.name
            s3.download_file(bucket, key, tmp_path)

        try:
            # Process video and emit events
            events_emitted = process_video(tmp_path, camera_id, video_s3_uri)

            return {
                "statusCode": 200,
                "body": json.dumps(
                    {
                        "camera_id": camera_id,
                        "video_s3_uri": video_s3_uri,
                        "events_emitted": events_emitted,
                    }
                ),
            }
        finally:
            # Clean up temp file
            os.unlink(tmp_path)


def process_video(video_path, camera_id, video_s3_uri):
    """
    Extract frames at 1fps, run Rekognition, emit detection events.

    Returns the number of detection events emitted.
    """
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps > 0 else 0

    print(f"Video: {video_path}, FPS: {fps}, Frames: {frame_count}, Duration: {duration}s")

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
            # Calculate frame time in seconds from start
            frame_time = extracted_idx * (1.0)  # 1fps means 1 second between frames
            timestamp = base_timestamp.isoformat()

            # Run Rekognition on frame
            labels = detect_labels(frame)

            if labels:
                detection_event = {
                    "camera_id": camera_id,
                    "timestamp": timestamp,
                    "labels": labels,
                    "frame_time": frame_time,
                }
                detection_events.append(detection_event)

            extracted_idx += 1

        frame_idx += 1

    cap.release()

    # Emit events to Kinesis
    events_emitted = 0
    for event_data in detection_events:
        kinesis.put_record(
            StreamName=STREAM_NAME,
            Data=json.dumps(event_data),
            PartitionKey=camera_id,
        )
        events_emitted += 1

    # Store processed video reference
    store_processed_video(camera_id, video_s3_uri, events_emitted, extracted_idx)

    print(f"Processed {extracted_idx} frames, emitted {events_emitted} detection events")

    return events_emitted


def detect_labels(frame):
    """
    Run Rekognition label detection on a frame.

    Args:
        frame: OpenCV image (numpy array in BGR format)

    Returns:
        List of label dictionaries with name, confidence, and bounding_box
    """
    # Convert BGR to RGB for Rekognition
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Encode to JPEG
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

            # Convert instances with bounding boxes
            for instance in label.get("Instances", []):
                bb = instance.get("BoundingBox", {})
                labels.append(
                    {
                        "name": label_name,
                        "confidence": float(Decimal(str(confidence))),
                        "bounding_box": {
                            "width": float(Decimal(str(bb.get("Width", 0)))),
                            "height": float(Decimal(str(bb.get("Height", 0)))),
                            "left": float(Decimal(str(bb.get("Left", 0)))),
                            "top": float(Decimal(str(bb.get("Top", 0)))),
                        },
                    }
                )

        return labels

    except Exception as e:
        print(f"Rekognition error: {e}")
        return []


def extract_camera_id(key):
    """Extract camera ID from S3 key."""
    parts = key.split("/")
    if len(parts) >= 2:
        return parts[1]
    return "unknown"


def store_processed_video(camera_id, video_s3_uri, events_emitted, frames_processed):
    """Store processed video reference in DynamoDB."""
    timestamp = datetime.utcnow().isoformat()

    try:
        job_table.put_item(
            Item={
                "job_id": f"demo-{camera_id}-{int(datetime.utcnow().timestamp())}",
                "camera_id": camera_id,
                "video_s3_uri": video_s3_uri,
                "status": "COMPLETED",
                "events_emitted": events_emitted,
                "frames_processed": frames_processed,
                "start_time": timestamp,
                "created_at": timestamp,
                "processing_mode": "demo",
            }
        )
    except Exception as e:
        print(f"Error storing processed video reference: {e}")