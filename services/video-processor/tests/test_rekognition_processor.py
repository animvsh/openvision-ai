import json
import os
import unittest
from decimal import Decimal
from unittest.mock import MagicMock, patch, call

os.environ["DYNAMODB_TABLE"] = "TestVideoProcessingJobs"
os.environ["KINESIS_STREAM"] = "TestDetectionEvents"
os.environ["SNS_TOPIC_ARN"] = "arn:aws:sns:us-east-1:123456789012:test-topic"
os.environ["REKOGNITION_ROLE_ARN"] = "arn:aws:iam::123456789012:role/test-role"

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../rekognition_processor"))


class TestRekognitionProcessor(unittest.TestCase):
    """Tests for rekognition_processor/lambda_function.py"""

    def setUp(self):
        """Set up test fixtures."""
        self.s3_event = {
            "Records": [
                {
                    "s3": {
                        "bucket": {"name": "test-bucket"},
                        "object": {"key": "videos/cam-01/test-video.mp4"},
                    }
                }
            ]
        }

        self.rekognition_callback = {
            "source": "aws.rekognition",
            "JobId": "test-job-123",
            "Status": "SUCCEEDED",
        }

    def test_extract_camera_id(self):
        """Test camera ID extraction from S3 key."""
        self.assertEqual(lambda_function.extract_camera_id("videos/cam-01/video.mp4"), "cam-01")
        self.assertEqual(lambda_function.extract_camera_id("videos/camera-123/clip.mov"), "camera-123")
        self.assertEqual(lambda_function.extract_camera_id("videos/cam_01/file"), "cam_01")
        self.assertEqual(lambda_function.extract_camera_id("no-prefix/file.mp4"), "unknown")
        self.assertEqual(lambda_function.extract_camera_id("videos/file"), "unknown")

    @patch("lambda_function.rekognition")
    @patch("lambda_function.job_table")
    def test_handle_s3_event_starts_rekognition_job(self, mock_table, mock_rekognition):
        """Test that S3 event triggers Rekognition job creation."""
        mock_rekognition.start_label_detection.return_value = {"JobId": "new-job-456"}
        mock_table.put_item.return_value = {}

        result = lambda_function.handle_s3_event(self.s3_event)

        self.assertEqual(result["statusCode"], 200)
        mock_rekognition.start_label_detection.assert_called_once()
        mock_table.put_item.assert_called_once()

        # Verify stored item structure
        call_args = mock_table.put_item.call_args
        item = call_args[1]["Item"]
        self.assertEqual(item["job_id"], "new-job-456")
        self.assertEqual(item["camera_id"], "cam-01")
        self.assertEqual(item["s3_key"], "videos/cam-01/test-video.mp4")
        self.assertEqual(item["status"], "IN_PROGRESS")

    @patch("lambda_function.kinesis")
    @patch("lambda_function.job_table")
    @patch("lambda_function.rekognition")
    def test_handle_rekognition_callback_success(self, mock_rekognition, mock_table, mock_kinesis):
        """Test that Rekognition callback parses labels and emits to Kinesis."""
        mock_rekognition.get_label_detection.return_value = {
            "Labels": [
                {
                    "Timestamp": 1000,
                    "Label": {
                        "Name": "Person",
                        "Confidence": 95.5,
                        "Instances": [
                            {
                                "BoundingBox": {
                                    "Width": 0.2,
                                    "Height": 0.4,
                                    "Left": 0.1,
                                    "Top": 0.1,
                                },
                                "Confidence": 94.8,
                            }
                        ],
                    },
                },
                {
                    "Timestamp": 2000,
                    "Label": {
                        "Name": "Phone",
                        "Confidence": 88.0,
                        "Instances": [],
                    },
                },
            ]
        }
        mock_table.get_item.return_value = {
            "Item": {
                "job_id": "test-job-123",
                "camera_id": "cam-01",
                "start_time": "2024-01-01T12:00:00",
            }
        }
        mock_table.update_item.return_value = {}
        mock_kinesis.put_record.return_value = {"SequenceNumber": "12345"}

        result = lambda_function.handle_rekognition_callback(self.rekognition_callback)

        self.assertEqual(result["statusCode"], 200)

        # Verify Kinesis emitted events
        self.assertEqual(mock_kinesis.put_record.call_count, 2)  # Person instance + Phone label

        # Verify first event (Person with bounding box)
        first_call_args = mock_kinesis.put_record.call_args_list[0]
        first_event = json.loads(first_call_args[1]["Data"])
        self.assertEqual(first_event["camera_id"], "cam-01")
        self.assertEqual(first_event["frame_time"], 1.0)
        self.assertEqual(len(first_event["labels"]), 1)
        self.assertEqual(first_event["labels"][0]["name"], "Person")
        self.assertAlmostEqual(first_event["labels"][0]["confidence"], 94.8, places=1)

    @patch("lambda_function.job_table")
    def test_handle_rekognition_callback_failed_job(self, mock_table):
        """Test handling of failed Rekognition job."""
        failed_callback = {
            "source": "aws.rekognition",
            "JobId": "failed-job-789",
            "Status": "FAILED",
        }
        mock_table.update_item.return_value = {}

        result = lambda_function.handle_rekognition_callback(failed_callback)

        self.assertEqual(result["statusCode"], 200)
        mock_table.update_item.assert_called_once()

    def test_lambda_handler_routes_s3_event(self):
        """Test lambda_handler routes S3 events correctly."""
        with patch.object(lambda_function, "handle_s3_event") as mock_handler:
            mock_handler.return_value = {"statusCode": 200, "body": "{}"}
            result = lambda_function.lambda_handler(self.s3_event, None)
            mock_handler.assert_called_once_with(self.s3_event)

    def test_lambda_handler_routes_rekognition_callback(self):
        """Test lambda_handler routes Rekognition callbacks correctly."""
        with patch.object(lambda_function, "handle_rekognition_callback") as mock_handler:
            mock_handler.return_value = {"statusCode": 200, "body": "{}"}
            result = lambda_function.lambda_handler(self.rekognition_callback, None)
            mock_handler.assert_called_once()

    def test_lambda_handler_returns_error_for_unknown_event(self):
        """Test lambda_handler returns error for unknown event type."""
        result = lambda_function.lambda_handler({"unknown": "event"}, None)
        self.assertEqual(result["statusCode"], 400)

    @patch("lambda_function.kinesis")
    @patch("lambda_function.job_table")
    @patch("lambda_function.rekognition")
    def test_handles_low_confidence_labels(self, mock_rekognition, mock_table, mock_kinesis):
        """Test that labels below 70% confidence are filtered out."""
        mock_rekognition.get_label_detection.return_value = {
            "Labels": [
                {
                    "Timestamp": 1000,
                    "Label": {
                        "Name": "Person",
                        "Confidence": 50.0,  # Below 70%
                        "Instances": [
                            {
                                "BoundingBox": {"Width": 0.2, "Height": 0.4, "Left": 0.1, "Top": 0.1},
                                "Confidence": 50.0,
                            }
                        ],
                    },
                }
            ]
        }
        mock_table.get_item.return_value = {
            "Item": {"job_id": "test-job-123", "camera_id": "cam-01", "start_time": "2024-01-01T12:00:00"}
        }
        mock_kinesis.put_record.return_value = {"SequenceNumber": "12345"}

        result = lambda_function.handle_rekognition_callback(self.rekognition_callback)

        # No events should be emitted due to low confidence
        self.assertEqual(mock_kinesis.put_record.call_count, 0)


class TestCameraIdExtraction(unittest.TestCase):
    """Test camera ID extraction edge cases."""

    def test_various_camera_id_formats(self):
        """Test extraction from different camera ID formats."""
        test_cases = [
            ("videos/cam-01/video.mp4", "cam-01"),
            ("videos/camera_1/file.mov", "camera_1"),
            ("videos/CAM01/file.avi", "CAM01"),
            ("videos/123/file.mp4", "123"),
            ("videos/cam-01-02/file.mp4", "cam-01-02"),
            ("videos/a/b/c/video.mp4", "a"),  # Only second part
            ("videos//video.mp4", "unknown"),  # Empty camera ID
        ]
        for key, expected in test_cases:
            self.assertEqual(lambda_function.extract_camera_id(key), expected)


if __name__ == "__main__":
    unittest.main()