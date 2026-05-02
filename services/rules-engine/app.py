"""
Flask app exposing the rules-engine service.
Processes detection events through the rules engine and returns triggered rules + scores.
"""

import os
import json
from flask import Flask, request, jsonify
from rules.classroom_rules import CLASSROOM_RULES
from rules.exam_rules import EXAM_RULES
from rules.security_rules import SECURITY_RULES
from scoring_engine import EngagementScore, DistractionScore, IntegrityRiskScore, SecurityRiskScore

app = Flask(__name__)


class RulesEngine:
    """Main rules engine for evaluating detection events."""

    def load_rules_for_mode(self, camera_mode: str) -> list:
        """Load active rules based on camera mode."""
        mode_rules = {
            'classroom': CLASSROOM_RULES,
            'exam': EXAM_RULES,
            'security': SECURITY_RULES,
        }
        return mode_rules.get(camera_mode, [])

    def evaluate_detection(self, detection: dict, rules: list) -> list:
        """Evaluate a detection against a list of rules."""
        triggered = []
        for rule in rules:
            if self._check_rule_match(detection, rule):
                triggered.append(rule)
        return triggered

    def _check_rule_match(self, detection: dict, rule: dict) -> bool:
        """Check if detection matches rule conditions."""
        condition = rule.get('condition', {})

        # Check label condition
        if 'label' in condition:
            if detection.get('label') != condition['label']:
                return False
            if 'confidence_greater_than' in condition:
                if detection.get('confidence', 0) <= condition['confidence_greater_than']:
                    return False

        # Check movement score condition
        if 'movement_score_greater_than' in condition:
            if detection.get('movement_score', 0) <= condition['movement_score_greater_than']:
                return False

        return True

    def calculate_scores(self, detection: dict) -> dict:
        """Calculate all scoring metrics for a detection."""
        return {
            'engagement': EngagementScore.calculate(detection),
            'distraction': DistractionScore.calculate(detection),
            'integrity_risk': IntegrityRiskScore.calculate(detection),
            'security_risk': SecurityRiskScore.calculate(detection)
        }

    def process_event(self, event: dict) -> dict:
        """Process a single detection event through the rules engine."""
        camera_id = event.get('camera_id', 'unknown')
        camera_mode = event.get('mode', 'classroom')
        detection = event.get('detection', {})

        # Load rules for the camera mode
        rules = self.load_rules_for_mode(camera_mode)

        # Evaluate detection against rules
        triggered_rules = self.evaluate_detection(detection, rules)

        # Calculate scores
        scores = self.calculate_scores(detection)

        results = {
            'camera_id': camera_id,
            'mode': camera_mode,
            'triggered_rules': [],
            'scores': scores
        }

        # Process each triggered rule
        for rule in triggered_rules:
            event_record = {
                'camera_id': camera_id,
                'rule_id': rule['rule_id'],
                'event_type': rule['event_type'],
                'severity': rule['severity'],
                'description': rule.get('description', ''),
                'detection_data': detection
            }
            results['triggered_rules'].append(event_record)

        return results


# Initialize the rules engine
rules_engine = RulesEngine()


@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "rules-engine"})


@app.route("/process-event", methods=["POST"])
def process_event():
    """Process a detection event through the rules engine.

    Expected JSON body:
    {
        "camera_id": "cam_001",
        "mode": "classroom",  # or "exam" or "security"
        "detection": {
            "label": "Mobile Phone",
            "confidence": 0.85,
            "movement_score": 0.3,
            ...
        }
    }
    """
    event = request.get_json()
    try:
        result = rules_engine.process_event(event)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/rules/<mode>")
def get_rules(mode):
    """Get all rules for a given mode (classroom, exam, security)."""
    rules = rules_engine.load_rules_for_mode(mode)
    return jsonify({
        'mode': mode,
        'rules': rules,
        'count': len(rules)
    })


@app.route("/scores", methods=["POST"])
def calculate_scores():
    """Calculate all scores for a detection without triggering rules."""
    detection = request.get_json()
    try:
        scores = rules_engine.calculate_scores(detection)
        return jsonify(scores)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port)