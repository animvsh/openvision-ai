"""
Rules Engine Lambda Function
Consumes events from Kinesis Data Streams, evaluates against rules, and triggers actions.
"""

import json
import os
from datetime import datetime
from typing import Any

import boto3

from rules.classroom_rules import CLASSROOM_RULES
from rules.exam_rules import EXAM_RULES
from rules.security_rules import SECURITY_RULES
from scoring_engine import EngagementScore, DistractionScore, IntegrityRiskScore, SecurityRiskScore


class RulesEngine:
    """Main rules engine for evaluating detection events."""

    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.sns = boto3.client('sns')
        self.bedrock = boto3.client('bedrock-runtime')

        self.camera_state_table = os.environ.get('CAMERA_STATE_TABLE', 'CameraState')
        self.events_table = os.environ.get('EVENTS_TABLE', 'Events')
        self.sns_topic_arn = os.environ.get('SNS_TOPIC_ARN', '')

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

    def create_event_record(self, camera_id: str, detection: dict, rule: dict) -> dict:
        """Create event record in RDS (DynamoDB for this implementation)."""
        table = self.dynamodb.Table(self.events_table)

        event = {
            'event_id': f"{camera_id}_{datetime.utcnow().isoformat()}",
            'camera_id': camera_id,
            'rule_id': rule['rule_id'],
            'event_type': rule['event_type'],
            'severity': rule['severity'],
            'detection_data': detection,
            'timestamp': datetime.utcnow().isoformat(),
            'processed': False
        }

        table.put_item(Item=event)
        return event

    def update_camera_state(self, camera_id: str, detection: dict, rule: dict) -> None:
        """Update live camera state in DynamoDB."""
        table = self.dynamodb.Table(self.camera_state_table)

        state = {
            'camera_id': camera_id,
            'last_detection': detection,
            'last_rule_triggered': rule['rule_id'],
            'last_event_type': rule['event_type'],
            'last_severity': rule['severity'],
            'last_updated': datetime.utcnow().isoformat()
        }

        table.put_item(Item=state)

    def trigger_sns_notification(self, event: dict) -> None:
        """Send SNS notification for high-severity events."""
        if event['severity'] not in ['high', 'critical']:
            return

        message = {
            'camera_id': event['camera_id'],
            'rule_id': event['rule_id'],
            'event_type': event['event_type'],
            'severity': event['severity'],
            'detection_data': event['detection_data'],
            'timestamp': event['timestamp']
        }

        self.sns.publish(
            TopicArn=self.sns_topic_arn,
            Message=json.dumps(message),
            Subject=f"Alert: {event['event_type']} - Severity: {event['severity']}"
        )

    def get_ai_summary(self, event: dict) -> str:
        """Call Bedrock for AI-generated summary of the event."""
        prompt = f"""
        Summarize the following security event in 2-3 sentences:
        Camera: {event['camera_id']}
        Event Type: {event['event_type']}
        Severity: {event['severity']}
        Detection: {json.dumps(event.get('detection_data', {}))}
        """

        try:
            response = self.bedrock.invoke_model(
                modelId='anthropic.claude-3-sonnet-20240229-v1:0',
                contentType='application/json',
                accept='application/json',
                body=json.dumps({
                    'anthropic_version': 'bedrock-2023-05-31',
                    'messages': [{
                        'role': 'user',
                        'content': prompt
                    }]
                })
            )

            response_body = json.loads(response['body'].read().decode('utf-8'))
            return response_body.get('content', [{}])[0].get('text', '')
        except Exception as e:
            return f"AI summary unavailable: {str(e)}"

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
            event_record = self.create_event_record(camera_id, detection, rule)
            self.update_camera_state(camera_id, detection, rule)
            self.trigger_sns_notification(event_record)

            # Add AI summary for high severity events
            if rule['severity'] in ['high', 'critical']:
                event_record['ai_summary'] = self.get_ai_summary(event_record)

            results['triggered_rules'].append(event_record)

        return results


def lambda_handler(event: dict, context: Any) -> dict:
    """
    AWS Lambda handler for processing Kinesis Data Streams events.
    """
    rules_engine = RulesEngine()
    results = []

    # Process Kinesis records
    for record in event.get('Records', []):
        # Decode Kinesis data
        payload = json.loads(record['kinesis']['data'])

        result = rules_engine.process_event(payload)
        results.append(result)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(results),
            'results': results
        })
    }


if __name__ == '__main__':
    # Local testing
    test_event = {
        'camera_id': 'cam_001',
        'mode': 'classroom',
        'detection': {
            'label': 'Mobile Phone',
            'confidence': 0.85,
            'movement_score': 0.3
        }
    }

    engine = RulesEngine()
    result = engine.process_event(test_event)
    print(json.dumps(result, indent=2))