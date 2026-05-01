"""
Security monitoring rules for physical security threat detection.
"""

SECURITY_RULES = [
    {
        "rule_id": "after_hours_person",
        "mode": "security",
        "event_type": "after_hours_person",
        "condition": {
            "person_detected": True,
            "time_period": "after_hours",
            "confidence_greater_than": 0.75
        },
        "severity": "high",
        "cooldown_seconds": 0,
        "description": "Person detected after authorized hours"
    },
    {
        "rule_id": "loitering",
        "mode": "security",
        "event_type": "loitering",
        "condition": {
            "person_detected": True,
            "stationary_duration_greater_than": 300
        },
        "severity": "medium",
        "cooldown_seconds": 60,
        "description": "Person loitering in area for extended period"
    },
    {
        "rule_id": "zone_breach",
        "mode": "security",
        "event_type": "zone_breach",
        "condition": {
            "restricted_zone_entry": True,
            "confidence_greater_than": 0.85
        },
        "severity": "critical",
        "cooldown_seconds": 0,
        "description": "Entry into restricted zone detected"
    },
    {
        "rule_id": "abandoned_object",
        "mode": "security",
        "event_type": "abandoned_object",
        "condition": {
            "object_left_unattended": True,
            "duration_greater_than": 120,
            "size_greater_than": 0.05
        },
        "severity": "high",
        "cooldown_seconds": 30,
        "description": "Unattended object detected for extended period"
    },
    {
        "rule_id": "tailgating",
        "mode": "security",
        "event_type": "tailgating",
        "condition": {
            "person_count": 1,
            "entry_event_count": 2,
            "time_window_seconds": 5
        },
        "severity": "high",
        "cooldown_seconds": 0,
        "description": "Multiple entries without proper authorization"
    },
    {
        "rule_id": "perimeter_breach",
        "mode": "security",
        "event_type": "perimeter_breach",
        "condition": {
            "perimeter_crossing": True,
            "confidence_greater_than": 0.9
        },
        "severity": "critical",
        "cooldown_seconds": 0,
        "description": "Perimeter breach detected"
    },
    {
        "rule_id": "crowd_formation",
        "mode": "security",
        "event_type": "crowd_formation",
        "condition": {
            "people_count_greater_than": 8,
            "density_greater_than": 0.7
        },
        "severity": "medium",
        "cooldown_seconds": 120,
        "description": "Large crowd formation detected"
    },
    {
        "rule_id": "violence_detected",
        "mode": "security",
        "event_type": "violence_detected",
        "condition": {
            "aggressive_pose_detected": True,
            "confidence_greater_than": 0.8
        },
        "severity": "critical",
        "cooldown_seconds": 0,
        "description": "Aggressive behavior or violence detected"
    },
    {
        "rule_id": "unauthorized_vehicle",
        "mode": "security",
        "event_type": "unauthorized_vehicle",
        "condition": {
            "vehicle_detected": True,
            "authorization_status": False
        },
        "severity": "high",
        "cooldown_seconds": 60,
        "description": "Unauthorized vehicle in restricted area"
    },
    {
        "rule_id": "fire_detected",
        "mode": "security",
        "event_type": "fire_detected",
        "condition": {
            "smoke_detected": True,
            "confidence_greater_than": 0.85
        },
        "severity": "critical",
        "cooldown_seconds": 0,
        "description": "Smoke or fire detected"
    }
]