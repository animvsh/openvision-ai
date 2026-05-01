from . import api_handler, get_pool, ValidationError, AuthError
from auth.middleware import require_auth, extract_token_from_event, validate_jwt_token, AuthError as AuthErrorMiddleware
from models.schemas import EventListParams, EventEscalate, EventDismiss, PaginationParams
from models.types import Event, EventStatus, EventSeverity
from pydantic import ValidationError
from datetime import datetime
import json


@require_auth
def list_events(event, context):
    try:
        params = EventListParams(**event.get("queryStringParameters", {}) or {})
    except ValidationError as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")
    offset = (params.page - 1) * params.limit

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        query = "SELECT id, session_id, camera_id, org_id, rule_id, severity, status, description, ai_summary, created_at, updated_at FROM events WHERE org_id = %s"
        values = [org_id]
        count_query = "SELECT COUNT(*) FROM events WHERE org_id = %s"

        if params.camera_id:
            query += " AND camera_id = %s"
            count_query += " AND camera_id = %s"
            values.append(params.camera_id)
        if params.severity:
            query += " AND severity = %s"
            count_query += " AND severity = %s"
            values.append(params.severity)
        if params.status:
            query += " AND status = %s"
            count_query += " AND status = %s"
            values.append(params.status)

        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        values.extend([params.limit, offset])

        cur.execute(query, values)
        rows = cur.fetchall()
        cur.execute(count_query, [org_id] + [v for v in values if v not in [params.limit, offset]])
        total = cur.fetchone()[0]

        events = [
            Event(
                id=row[0], session_id=row[1], camera_id=row[2], org_id=row[3],
                rule_id=row[4], severity=EventSeverity(row[5]), status=EventStatus(row[6]),
                description=row[7], ai_summary=row[8], created_at=row[9], updated_at=row[10]
            ).model_dump()
            for row in rows
        ]
        return {"success": True, "data": {"items": events, "total": total, "page": params.page, "limit": params.limit}, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def get_event(event, context):
    event_id = event.get("pathParameters", {}).get("event_id")
    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, session_id, camera_id, org_id, rule_id, severity, status, description, ai_summary, created_at, updated_at FROM events WHERE id = %s AND org_id = %s",
            (event_id, org_id)
        )
        row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Event not found", "data": None})}

        event_obj = Event(
            id=row[0], session_id=row[1], camera_id=row[2], org_id=row[3],
            rule_id=row[4], severity=EventSeverity(row[5]), status=EventStatus(row[6]),
            description=row[7], ai_summary=row[8], created_at=row[9], updated_at=row[10]
        ).model_dump()
        return {"success": True, "data": event_obj, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def escalate_event(event, context):
    try:
        body = EventEscalate(**json.loads(event.get("body", "{}")))
    except (ValidationError, json.JSONDecodeError) as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")
    now = datetime.utcnow()

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE events SET status = %s, updated_at = %s WHERE id = %s AND org_id = %s RETURNING id",
                   (EventStatus.ESCALATED.value, now, body.event_id, org_id))
        if not cur.fetchone():
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Event not found", "data": None})}
        conn.commit()
        return {"success": True, "data": {"event_id": body.event_id, "status": EventStatus.ESCALATED.value}, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def dismiss_event(event, context):
    try:
        body = EventDismiss(**json.loads(event.get("body", "{}")))
    except (ValidationError, json.JSONDecodeError) as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")
    now = datetime.utcnow()

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE events SET status = %s, updated_at = %s WHERE id = %s AND org_id = %s RETURNING id",
                   (EventStatus.DISMISSED.value, now, body.event_id, org_id))
        if not cur.fetchone():
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Event not found", "data": None})}
        conn.commit()
        return {"success": True, "data": {"event_id": body.event_id, "status": EventStatus.DISMISSED.value}, "error": None}
    finally:
        pool.putconn(conn)
