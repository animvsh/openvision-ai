import boto3
from botocore.config import Config
import json

import os

bedrock = boto3.client(
    'bedrock-runtime',
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
    config=Config(connect_timeout=5, read_timeout=60)
)

SYSTEM_PROMPT = """You are an AI safety and engagement analyst for OpenVision AI.
You analyze camera intelligence events and provide clear, ethical summaries.
Never accuse individuals. Focus on patterns and recommended actions."""

def summarize_event(event_data):
    prompt = f"""Analyze this {event_data['mode']} event:
- Camera: {event_data['camera']}
- Event Type: {event_data['event_type']}
- Timestamp: {event_data['timestamp']}
- Duration: {event_data.get('duration_seconds', 0)} seconds
- Confidence: {event_data.get('confidence', 0)}%
- Signals: {', '.join(event_data.get('signals', []))}

Provide a JSON response with:
{{"summary": "...", "severity_reason": "...", "recommended_action": "..."}}"""

    response = bedrock.converse(
        modelId="anthropic.claude-3-haiku-20240307-v1:0",
        messages=[{"role": "user", "content": [{"text": prompt}]}]
    )
    return json.loads(response['output']['message']['content'][0]['text'])