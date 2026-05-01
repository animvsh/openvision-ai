import pytest
import json
from unittest.mock import MagicMock, patch
from models.schemas import EventListParams, EventEscalate, EventDismiss
from models.types import EventStatus, EventSeverity


class TestEventSchemas:
    def test_event_list_params_defaults(self):
        params = EventListParams()
        assert params.page == 1
        assert params.limit == 20
        assert params.camera_id is None
        assert params.severity is None
        assert params.status is None

    def test_event_list_params_with_filters(self):
        params = EventListParams(camera_id="cam123", severity="high", status="new")
        assert params.camera_id == "cam123"
        assert params.severity == "high"
        assert params.status == "new"

    def test_event_escalate_valid(self):
        escalate = EventEscalate(event_id="evt123", notes="Urgent investigation needed")
        assert escalate.event_id == "evt123"
        assert escalate.notes == "Urgent investigation needed"

    def test_event_escalate_minimal(self):
        escalate = EventEscalate(event_id="evt123")
        assert escalate.event_id == "evt123"
        assert escalate.notes is None

    def test_event_dismiss_valid(self):
        dismiss = EventDismiss(event_id="evt123", reason="False positive")
        assert dismiss.event_id == "evt123"
        assert dismiss.reason == "False positive"

    def test_event_dismiss_empty_event_id_fails(self):
        with pytest.raises(Exception):
            EventDismiss(event_id="")


class TestEventAuth:
    @patch("routes.events.get_pool")
    def test_list_events_unauthorized(self, mock_get_pool):
        from routes.events import list_events
        event = {"headers": {}, "queryStringParameters": {}}
        result = list_events(event, None)
        assert result["statusCode"] == 401

    @patch("routes.events.get_pool")
    def test_list_events_no_token(self, mock_get_pool):
        from routes.events import list_events
        event = {"headers": {}, "queryStringParameters": {}}
        result = list_events(event, None)
        assert result["statusCode"] == 401


class TestEventEndpoints:
    @patch("routes.events.get_pool")
    @patch("auth.middleware.validate_jwt_token")
    @patch("auth.middleware.extract_token_from_event")
    def test_list_events_success(self, mock_extract, mock_validate, mock_get_pool):
        from routes.events import list_events

        mock_extract.return_value = "valid_token"
        mock_validate.return_value = {"user_id": "user1", "org_id": "org1"}

        mock_pool = MagicMock()
        mock_get_pool.return_value = mock_pool
        mock_conn = MagicMock()
        mock_pool.getconn.return_value = mock_conn
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchall.return_value = [
            ("evt1", "sess1", "cam1", "org1", "rule1", "high", "new", "Test event", None, "2024-01-01", "2024-01-01")
        ]
        mock_cursor.fetchone.return_value = 1

        event = {
            "headers": {"Authorization": "Bearer valid_token"},
            "queryStringParameters": {}
        }

        result = list_events(event, None)
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["success"] is True
        assert len(body["data"]["items"]) == 1

    @patch("routes.events.get_pool")
    @patch("auth.middleware.validate_jwt_token")
    @patch("auth.middleware.extract_token_from_event")
    def test_get_event_not_found(self, mock_extract, mock_validate, mock_get_pool):
        from routes.events import get_event

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
            "pathParameters": {"event_id": "nonexistent"}
        }

        result = get_event(event, None)
        assert result["statusCode"] == 404

    @patch("routes.events.get_pool")
    @patch("auth.middleware.validate_jwt_token")
    @patch("auth.middleware.extract_token_from_event")
    def test_escalate_event_success(self, mock_extract, mock_validate, mock_get_pool):
        from routes.events import escalate_event

        mock_extract.return_value = "valid_token"
        mock_validate.return_value = {"user_id": "user1", "org_id": "org1"}

        mock_pool = MagicMock()
        mock_get_pool.return_value = mock_pool
        mock_conn = MagicMock()
        mock_pool.getconn.return_value = mock_conn
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = ("evt123",)

        event = {
            "headers": {"Authorization": "Bearer valid_token"},
            "body": json.dumps({"event_id": "evt123", "notes": "Escalate to security team"})
        }

        result = escalate_event(event, None)
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["success"] is True
        assert body["data"]["status"] == "escalated"

    @patch("routes.events.get_pool")
    @patch("auth.middleware.validate_jwt_token")
    @patch("auth.middleware.extract_token_from_event")
    def test_dismiss_event_success(self, mock_extract, mock_validate, mock_get_pool):
        from routes.events import dismiss_event

        mock_extract.return_value = "valid_token"
        mock_validate.return_value = {"user_id": "user1", "org_id": "org1"}

        mock_pool = MagicMock()
        mock_get_pool.return_value = mock_pool
        mock_conn = MagicMock()
        mock_pool.getconn.return_value = mock_conn
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = ("evt123",)

        event = {
            "headers": {"Authorization": "Bearer valid_token"},
            "body": json.dumps({"event_id": "evt123", "reason": "False positive"})
        }

        result = dismiss_event(event, None)
        assert result["statusCode"] == 200
        body = json.loads(result["body"])
        assert body["success"] is True
        assert body["data"]["status"] == "dismissed"
