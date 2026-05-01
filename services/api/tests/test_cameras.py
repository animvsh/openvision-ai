import pytest
import json
from unittest.mock import MagicMock, patch
from models.schemas import CameraCreate, CameraUpdate, PaginationParams
from models.types import CameraStatus


class TestCameraSchemas:
    def test_camera_create_valid(self):
        camera = CameraCreate(name="Front Door", location="Building A")
        assert camera.name == "Front Door"
        assert camera.location == "Building A"
        assert camera.rtsp_url is None

    def test_camera_create_with_rtsp(self):
        camera = CameraCreate(name="Backyard", location="Building B", rtsp_url="rtsp://192.168.1.100/stream")
        assert camera.rtsp_url == "rtsp://192.168.1.100/stream"

    def test_camera_create_empty_name_fails(self):
        with pytest.raises(Exception):
            CameraCreate(name="", location="Building A")

    def test_camera_update_partial(self):
        update = CameraUpdate(name="New Name")
        assert update.name == "New Name"
        assert update.location is None
        assert update.status is None

    def test_pagination_defaults(self):
        params = PaginationParams()
        assert params.page == 1
        assert params.limit == 20

    def test_pagination_custom(self):
        params = PaginationParams(page=2, limit=50)
        assert params.page == 2
        assert params.limit == 50

    def test_pagination_limit_exceeds_max(self):
        with pytest.raises(Exception):
            PaginationParams(limit=200)


class TestCameraAuth:
    @patch("routes.cameras.get_pool")
    def test_list_cameras_unauthorized(self, mock_get_pool):
        from routes.cameras import list_cameras
        event = {"headers": {}, "queryStringParameters": {}}
        result = list_cameras(event, None)
        assert result["statusCode"] == 401

    @patch("routes.cameras.get_pool")
    def test_list_cameras_no_token(self, mock_get_pool):
        from routes.cameras import list_cameras
        event = {"headers": {}, "queryStringParameters": {}}
        result = list_cameras(event, None)
        assert result["statusCode"] == 401


class TestCameraCRUD:
    @patch("routes.cameras.get_pool")
    @patch("auth.middleware.validate_jwt_token")
    @patch("auth.middleware.extract_token_from_event")
    def test_create_camera_success(self, mock_extract, mock_validate, mock_get_pool):
        from routes.cameras import create_camera

        mock_extract.return_value = "valid_token"
        mock_validate.return_value = {"user_id": "user1", "org_id": "org1"}

        mock_pool = MagicMock()
        mock_get_pool.return_value = mock_pool
        mock_conn = MagicMock()
        mock_pool.getconn.return_value = mock_conn
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = ("cam123",)

        event = {
            "headers": {"Authorization": "Bearer valid_token"},
            "body": json.dumps({"name": "Test Camera", "location": "Test Location"})
        }

        result = create_camera(event, None)
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["success"] is True

    @patch("routes.cameras.get_pool")
    @patch("auth.middleware.validate_jwt_token")
    @patch("auth.middleware.extract_token_from_event")
    def test_get_camera_not_found(self, mock_extract, mock_validate, mock_get_pool):
        from routes.cameras import get_camera

        mock_extract.return_value = "valid_token"
        mock_validate.return_value = {"user_id": "user1", "org_id": "org1"}

        mock_pool = MagicMock()
        mock_get_pool.return_value = mock_pool
        mock_conn = MagicMock()
        mock_pool.getconn.return_value = mock_conn
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = None

        event = {
            "headers": {"Authorization": "Bearer valid_token"},
            "pathParameters": {"camera_id": "nonexistent"}
        }

        result = get_camera(event, None)
        assert result["statusCode"] == 404

    @patch("routes.cameras.get_pool")
    @patch("auth.middleware.validate_jwt_token")
    @patch("auth.middleware.extract_token_from_event")
    def test_delete_camera_success(self, mock_extract, mock_validate, mock_get_pool):
        from routes.cameras import delete_camera

        mock_extract.return_value = "valid_token"
        mock_validate.return_value = {"user_id": "user1", "org_id": "org1"}

        mock_pool = MagicMock()
        mock_get_pool.return_value = mock_pool
        mock_conn = MagicMock()
        mock_pool.getconn.return_value = mock_conn
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = ("cam123",)

        event = {
            "headers": {"Authorization": "Bearer valid_token"},
            "pathParameters": {"camera_id": "cam123"}
        }

        result = delete_camera(event, None)
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["success"] is True
        assert body["data"]["deleted"] == "cam123"
