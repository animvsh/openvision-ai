from . import api_handler, get_pool, ValidationError, AuthError
from auth.middleware import require_auth, extract_token_from_event, validate_jwt_token, AuthError as AuthErrorMiddleware
from models.schemas import AISummarizeEvent, AISummarizeSession
from pydantic import ValidationError
import boto3
import json


def call_bedrock(summary_type: str, payload: dict) -> str:
    try:
        client = boto3.client("bedrock-agent-runtime", region="us-east-1")
        if summary_type == "event":
            response = client.invoke_agent(
                agentId=payload.get("agent_id", ""),
                sessionId=payload.get("session_id", ""),
                inputText=f"Summarize this event concisely: {payload.get('description', '')}"
            )
        else:
            response = client.invoke_agent(
                agentId=payload.get("agent_id", ""),
                sessionId=payload.get("session_id", ""),
                inputText=f"Provide a session summary highlighting key events"
            )
        return response.get("outputText", "Summary unavailable")
    except Exception as e:
        return f"AI summary generation failed: {str(e)}"


@require_auth
def summarize_event(event, context):
    try:
        body = AISummarizeEvent(**json.loads(event.get("body", "{}")))
    except (ValidationError, json.JSONDecodeError) as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT description, ai_summary FROM events WHERE id = %s AND org_id = %s", (body.event_id, org_id))
        row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Event not found", "data": None})}

        description, existing_summary = row
        if existing_summary:
            return {"success": True, "data": {"event_id": body.event_id, "summary": existing_summary, "cached": True}, "error": None}

        summary = call_bedrock("event", {"description": description, "event_id": body.event_id})

        cur.execute("UPDATE events SET ai_summary = %s WHERE id = %s", (summary, body.event_id))
        conn.commit()

        return {"success": True, "data": {"event_id": body.event_id, "summary": summary, "cached": False}, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def summarize_session(event, context):
    try:
        body = AISummarizeSession(**json.loads(event.get("body", "{}")))
    except (ValidationError, json.JSONDecodeError) as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM sessions WHERE id = %s AND org_id = %s", (body.session_id, org_id))
        if not cur.fetchone():
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Session not found", "data": None})}

        if body.highlights_only:
            cur.execute("""
                SELECT ai_summary FROM events
                WHERE session_id = %s AND org_id = %s AND ai_summary IS NOT NULL
                ORDER BY severity DESC, created_at DESC
                LIMIT 5
            """, (body.session_id, org_id))
        else:
            cur.execute("""
                SELECT ai_summary FROM events
                WHERE session_id = %s AND org_id = %s AND ai_summary IS NOT NULL
                ORDER BY created_at DESC
            """, (body.session_id, org_id))

        summaries = [row[0] for row in cur.fetchall()]
        combined = " | ".join(summaries) if summaries else "No AI summaries available for this session"

        return {"success": True, "data": {"session_id": body.session_id, "summary": combined, "highlights": summaries[:5] if body.highlights_only else summaries}, "error": None}
    finally:
        pool.putconn(conn)
