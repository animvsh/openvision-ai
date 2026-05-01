import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

rekognition = boto3.client("rekognition", region_name=os.environ.get('AWS_REGION', 'us-east-1'))
dynamodb = boto3.resource("dynamodb", region_name=os.environ.get('AWS_REGION', 'us-east-1'))
kinesis = boto3.client("kinesis", region_name=os.environ.get('AWS_REGION', 'us-east-1'))

TABLE_NAME = os.environ.get("DYNAMODB_TABLE", "VideoProcessingJobs")
STREAM_NAME = os.environ.get("KINESIS_STREAM", "DetectionEvents")

job_table = dynamodb.Table(TABLE_NAME)


def lambda_handler(event, context):
    """
    Handles S3 video upload events and Rekognition job completion events.

    When S3 video upload triggers:
    - Start Rekognition label detection job
    - Store job ARN in DynamoDB

    When Rekognition completes:
    - Parse label detections (Person, Phone, Laptop, etc.)
    - Emit detection events to Kinesis Data Streams
    """
    print(f"Event: {json.dumps(event)}")

    # Route based on event source
    source = event.get("source", "")
    if source == "aws.rekognition":
        return handle_rekognition_callback(event)
    elif "Records" in event:
        return handle_s3_event(event)

    return {"statusCode": 400, "body": json.dumps("Unknown event type")}


def handle_s3_event(event):
    """Handle S3 ObjectCreated event - start Rekognition job."""
    for record in event["Records"]:
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        if not key.startswith("videos/"):
            continue

        camera_id = extract_camera_id(key)
        video_s3_uri = f"s3://{bucket}/{key}"

        # Start Rekognition label detection job
        response = rekognition.start_label_detection(
            Video={"S3Object": {"Bucket": bucket, "Name": key}},
            MinConfidence=70,
            NotificationChannel={
                "SNSTopicARN": os.environ.get("SNS_TOPIC_ARN", ""),
                "RoleARN": os.environ.get("REKOGNITION_ROLE_ARN", ""),
            },
        )

        job_id = response["JobId"]
        start_time = datetime.utcnow().isoformat()

        # Store job ARN in DynamoDB
        job_table.put_item(
            Item={
                "job_id": job_id,
                "camera_id": camera_id,
                "video_s3_uri": video_s3_uri,
                "s3_key": key,
                "status": "IN_PROGRESS",
                "start_time": start_time,
                "created_at": start_time,
            }
        )

        print(f"Started Rekognition job {job_id} for {video_s3_uri}")

        return {
            "statusCode": 200,
            "body": json.dumps({"job_id": job_id, "camera_id": camera_id}),
        }

    return {"statusCode": 200, "body": json.dumps("No videos found in event")}


def handle_rekognition_callback(event):
    """Handle Rekognition completion callback - parse labels and emit to Kinesis."""
    job_id = event.get("JobId")
    status = event.get("Status")

    if status != "SUCCEEDED":
        print(f"Job {job_id} failed with status: {status}")
        update_job_status(job_id, "FAILED")
        return {"statusCode": 200, "body": json.dumps("Job failed")}

    # Get detection results
    response = rekognition.get_label_detection(JobId=job_id)
    labels = response.get("Labels", [])

    # Get job metadata from DynamoDB
    job_item = get_job(job_id)
    if not job_item:
        print(f"Job {job_id} not found in DynamoDB")
        return {"statusCode": 404, "body": json.dumps("Job not found")}

    camera_id = job_item["camera_id"]
    timestamp = job_item["start_time"]

    # Parse and emit detection events
    detection_events = []
    for label in labels:
        detection_time = label.get("Timestamp", 0)
        frame_time = detection_time / 1000.0  # Convert ms to seconds

        for lbl in label.get("Label", {}).get("Instances", []):
            bounding_box = lbl.get("BoundingBox", {})
            confidence = lbl.get("Confidence", 0)

            if confidence < 70:
                continue

            detection_event = {
                "camera_id": camera_id,
                "timestamp": timestamp,
                "labels": [
                    {
                        "name": label["Label"]["Name"],
                        "confidence": float(Decimal(str(confidence))),
                        "bounding_box": {
                            "width": float(Decimal(str(bounding_box.get("Width", 0)))),
                            "height": float(Decimal(str(bounding_box.get("Height", 0)))),
                            "left": float(Decimal(str(bounding_box.get("Left", 0)))),
                            "top": float(Decimal(str(bounding_box.get("Top", 0)))),
                        },
                    }
                ],
                "frame_time": frame_time,
            }
            detection_events.append(detection_event)

    # If no instances with bounding boxes, emit a frame-level summary
    if not detection_events:
        for label in labels:
            if label["Label"].get("Confidence", 0) >= 70:
                detection_event = {
                    "camera_id": camera_id,
                    "timestamp": timestamp,
                    "labels": [
                        {
                            "name": label["Label"]["Name"],
                            "confidence": float(Decimal(str(label["Label"]["Confidence"]))),
                            "bounding_box": None,
                        }
                    ],
                    "frame_time": label.get("Timestamp", 0) / 1000.0,
                }
                detection_events.append(detection_event)

    # Emit events to Kinesis
    for event_data in detection_events:
        kinesis.put_record(
            StreamName=STREAM_NAME,
            Data=json.dumps(event_data),
            PartitionKey=camera_id,
        )

    update_job_status(job_id, "COMPLETED")

    print(f"Emitted {len(detection_events)} detection events for job {job_id}")

    return {
        "statusCode": 200,
        "body": json.dumps(
            {"job_id": job_id, "events_emitted": len(detection_events)}
        ),
    }


def extract_camera_id(key):
    """Extract camera ID from S3 key."""
    # Format: videos/{camera_id}/{filename}
    parts = key.split("/")
    if len(parts) >= 2:
        return parts[1]
    return "unknown"


def get_job(job_id):
    """Retrieve job from DynamoDB."""
    try:
        response = job_table.get_item(Key={"job_id": job_id})
        return response.get("Item")
    except Exception as e:
        print(f"Error getting job {job_id}: {e}")
        return None


def update_job_status(job_id, status):
    """Update job status in DynamoDB."""
    try:
        job_table.update_item(
            Key={"job_id": job_id},
            UpdateExpression="SET #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":status": status,
                ":updated_at": datetime.utcnow().isoformat(),
            },
        )
    except Exception as e:
        print(f"Error updating job {job_id}: {e}")