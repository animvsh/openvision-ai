import anthropic
import json
import os

client = anthropic.Anthropic()

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

    response = client.messages.create(
        model="claude-haiku-3-5-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}]
    )
    return json.loads(response.content[0].text)