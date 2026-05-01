import pytest
from unittest.mock import patch, MagicMock


class TestBedrockSummarizer:
    """Tests for Bedrock summarizer Lambda function."""

    @patch("bedrock_summarizer.lambda_function.bedrock")
    def test_summarize_event_returns_expected_keys(self, mock_bedrock):
        """Verify summarize_event returns summary, severity_reason, and recommended_action."""
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": '{"summary": "Test summary", "severity_reason": "low", "recommended_action": "monitor"}'}
                    ]
                }
            }
        }

        from bedrock_summarizer.lambda_function import summarize_event

        result = summarize_event({
            "mode": "classroom",
            "camera": "cam-1",
            "event_type": "motion",
            "timestamp": "2024-01-01T10:00:00Z",
            "duration_seconds": 30,
            "confidence": 85,
            "signals": ["movement"]
        })

        assert "summary" in result
        assert "severity_reason" in result
        assert "recommended_action" in result

    @patch("bedrock_summarizer.lambda_function.bedrock")
    def test_summarize_event_passes_correct_prompt(self, mock_bedrock):
        """Verify the prompt contains event data."""
        mock_bedrock.converse.return_value = {
            "output": {
                "message": {
                    "content": [
                        {"text": '{"summary": "test", "severity_reason": "low", "recommended_action": "none"}'}
                    ]
                }
            }
        }

        from bedrock_summarizer.lambda_function import summarize_event

        event_data = {
            "mode": "test-mode",
            "camera": "test-cam",
            "event_type": "test-event",
            "timestamp": "2024-01-01T00:00:00Z",
            "signals": ["sig1", "sig2"]
        }
        summarize_event(event_data)

        mock_bedrock.converse.assert_called_once()
        call_args = mock_bedrock.converse.call_args
        assert "test-mode" in str(call_args)


class TestSessionSummarizer:
    """Tests for session summarizer."""

    def test_summarize_session_empty_events(self):
        """Empty event list returns appropriate empty response."""
        from session_summarizer import summarize_session

        result = summarize_session([])

        assert result["event_count"] == 0
        assert "No events recorded" in result["session_summary"]

    def test_summarize_session_single_event(self):
        """Single event session returns correct count."""
        from session_summarizer import summarize_session

        events = [{
            "camera": "cam-1",
            "severity_reason": "low",
            "recommended_action": "monitor"
        }]
        result = summarize_session(events)

        assert result["event_count"] == 1
        assert result["overall_severity"] == "low"

    def test_summarize_session_multiple_cameras(self):
        """Multiple cameras triggers pattern detection."""
        from session_summarizer import summarize_session

        events = [
            {"camera": "cam-1", "severity_reason": "low", "recommended_action": "a"},
            {"camera": "cam-2", "severity_reason": "low", "recommended_action": "b"},
        ]
        result = summarize_session(events)

        assert result["event_count"] == 2
        assert "Multiple cameras" in result["pattern_analysis"][0]

    def test_summarize_session_context_passed_through(self):
        """Session context metadata is preserved in output."""
        from session_summarizer import summarize_session

        context = {"room_id": "room-101", "date": "2024-01-01"}
        result = summarize_session([], session_context=context)

        assert result["session_context"]["room_id"] == "room-101"

    def test_summarize_session_deduplicates_actions(self):
        """Same recommended action appears only once."""
        from session_summarizer import summarize_session

        events = [
            {"recommended_action": "monitor"},
            {"recommended_action": "monitor"},
            {"recommended_action": "escalate"},
        ]
        result = summarize_session(events)

        actions = result["recommended_actions"]
        assert actions.count("monitor") == 1
        assert "escalate" in actions