"""
Classroom monitoring rules for student behavior detection.
"""

CLASSROOM_RULES = [
    {
        "rule_id": "phone_detected",
        "mode": "classroom",
        "event_type": "phone_detected",
        "condition": {"label": "Mobile Phone", "confidence_greater_than": 0.8},
        "severity": "low",
        "cooldown_seconds": 60,
        "description": "Student using phone during class"
    },
    {
        "rule_id": "distraction_spike",
        "mode": "classroom",
        "event_type": "distraction_spike",
        "condition": {"movement_score_greater_than": 0.7},
        "severity": "medium",
        "cooldown_seconds": 120,
        "description": "Unusual movement pattern indicating distraction"
    },
    {
        "rule_id": "head_down",
        "mode": "classroom",
        "event_type": "head_down",
        "condition": {"attention_proxy_less_than": 0.3},
        "severity": "low",
        "cooldown_seconds": 180,
        "description": "Student head down on desk"
    },
    {
        "rule_id": "looking_away",
        "mode": "classroom",
        "event_type": "looking_away",
        "condition": {"looking_away_duration_seconds_greater_than": 15},
        "severity": "low",
        "cooldown_seconds": 60,
        "description": "Student looking away from learning content"
    },
    {
        "rule_id": "person_lying_down",
        "mode": "classroom",
        "event_type": "person_lying_down",
        "condition": {"pose_label": "lying down", "confidence_greater_than": 0.75},
        "severity": "medium",
        "cooldown_seconds": 60,
        "description": "Person lying down in classroom"
    },
    {
        "rule_id": "no_activity",
        "mode": "classroom",
        "event_type": "no_activity",
        "condition": {"people_count": 0, "duration_seconds_greater_than": 300},
        "severity": "low",
        "cooldown_seconds": 600,
        "description": "No activity detected for extended period"
    },
    {
        "rule_id": "crowd_gathering",
        "mode": "classroom",
        "event_type": "crowd_gathering",
        "condition": {"people_count_greater_than": 5, "density_greater_than": 0.6},
        "severity": "medium",
        "cooldown_seconds": 180,
        "description": "Multiple people gathered in small area"
    },
    {
        "rule_id": "rapid_movement",
        "mode": "classroom",
        "event_type": "rapid_movement",
        "condition": {"movement_intensity_greater_than": 0.85},
        "severity": "low",
        "cooldown_seconds": 30,
        "description": "Rapid movement detected"
    }
]