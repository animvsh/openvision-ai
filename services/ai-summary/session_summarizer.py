"""Session summarizer for aggregating multiple event summaries."""
import json
from typing import List, Dict, Any


def summarize_session(events: List[Dict[str, Any]], session_context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Summarize an entire classroom session from multiple events.

    Args:
        events: List of event dictionaries with summarization results
        session_context: Optional session metadata (room_id, date, etc.)

    Returns:
        Aggregated session summary with patterns and overall assessment
    """
    if not events:
        return {
            "session_summary": "No events recorded for this session.",
            "event_count": 0,
            "pattern_analysis": [],
            "overall_severity": "none",
            "recommended_actions": []
        }

    event_count = len(events)
    patterns = _identify_patterns(events)
    severity_levels = [e.get("severity_reason", "unknown") for e in events]

    overall_severity = _compute_overall_severity(severity_levels)

    return {
        "session_summary": _generate_session_summary(event_count, patterns),
        "event_count": event_count,
        "pattern_analysis": patterns,
        "overall_severity": overall_severity,
        "recommended_actions": _aggregate_recommendations(events),
        "session_context": session_context or {}
    }


def _identify_patterns(events: List[Dict[str, Any]]) -> List[str]:
    """Identify recurring patterns across events."""
    patterns = []
    cameras = [e.get("camera") for e in events]
    if len(set(cameras)) > 1:
        patterns.append("Multiple cameras triggered simultaneously")
    return patterns


def _compute_overall_severity(severity_levels: List[str]) -> str:
    """Determine overall session severity."""
    severity_order = ["critical", "high", "medium", "low", "none"]
    for level in severity_order:
        if level in severity_levels:
            return level
    return "unknown"


def _generate_session_summary(event_count: int, patterns: List[str]) -> str:
    """Generate natural language session summary."""
    summary = f"Session recorded {event_count} event"
    if event_count != 1:
        summary += "s"
    if patterns:
        summary += f". Patterns identified: {', '.join(patterns)}."
    return summary


def _aggregate_recommendations(events: List[Dict[str, Any]]) -> List[str]:
    """Aggregate unique recommended actions from all events."""
    actions = set()
    for event in events:
        action = event.get("recommended_action")
        if action:
            actions.add(action)
    return list(actions)[:5]