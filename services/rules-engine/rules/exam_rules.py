"""
Exam integrity monitoring rules for detecting academic dishonesty signals.
"""

EXAM_RULES = [
    {
        "rule_id": "phone_detected_exam",
        "mode": "exam",
        "event_type": "phone_detected",
        "condition": {"label": "Mobile Phone", "confidence_greater_than": 0.8},
        "severity": "high",
        "cooldown_seconds": 30,
        "description": "Phone detected during exam - high integrity risk"
    },
    {
        "rule_id": "collaboration_signal",
        "mode": "exam",
        "event_type": "collaboration_signal",
        "condition": {
            "head_orientation_similarity_greater_than": 0.9,
            "people_count_greater_than": 1
        },
        "severity": "high",
        "cooldown_seconds": 60,
        "description": "Multiple students showing similar head orientation - possible collaboration"
    },
    {
        "rule_id": "attention_shift",
        "mode": "exam",
        "event_type": "attention_shift",
        "condition": {
            "looking_away_frequency_greater_than": 3,
            "duration_seconds_greater_than": 30
        },
        "severity": "medium",
        "cooldown_seconds": 120,
        "description": "Frequent attention shifts during exam"
    },
    {
        "rule_id": "paper_passing",
        "mode": "exam",
        "event_type": "paper_passing",
        "condition": {
            "object_transfer_detected": True,
            "distance_between_people_less_than": 1.0
        },
        "severity": "high",
        "cooldown_seconds": 30,
        "description": "Object transfer between students detected"
    },
    {
        "rule_id": "device_placement",
        "mode": "exam",
        "event_type": "device_placement",
        "condition": {
            "label": "Electronic Device",
            "confidence_greater_than": 0.85,
            "stationary_duration_greater_than": 60
        },
        "severity": "high",
        "cooldown_seconds": 60,
        "description": "Electronic device placed in testing area"
    },
    {
        "rule_id": "unauthorized_material",
        "mode": "exam",
        "event_type": "unauthorized_material",
        "condition": {
            "label": "Paper",
            "confidence_greater_than": 0.7,
            "size_greater_than": 0.1,
            "stationary_duration_greater_than": 120
        },
        "severity": "medium",
        "cooldown_seconds": 180,
        "description": "Unauthorized paper material detected"
    },
    {
        "rule_id": "abnormal_gaze_pattern",
        "mode": "exam",
        "event_type": "abnormal_gaze_pattern",
        "condition": {
            "gaze_stability_score_less_than": 0.4,
            "scan_frequency_greater_than": 5
        },
        "severity": "medium",
        "cooldown_seconds": 120,
        "description": "Abnormal eye movement pattern suggesting cheating"
    },
    {
        "rule_id": "hand_movement_pattern",
        "mode": "exam",
        "event_type": "hand_movement_pattern",
        "condition": {
            "writing_motion_detected": True,
            "duration_seconds_greater_than": 45
        },
        "severity": "low",
        "cooldown_seconds": 300,
        "description": "Extended writing motion detected"
    }
]