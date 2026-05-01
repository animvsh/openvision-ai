from . import api_handler, get_pool, ValidationError, AuthError
from auth.middleware import require_auth, extract_token_from_event, validate_jwt_token, AuthError as AuthErrorMiddleware
from models.schemas import SessionStart, PaginationParams
from models.types import Session, SessionStatus
from pydantic import ValidationError
from datetime import datetime
import json


@require_auth
def start_session(event, context):
    try:
        body = SessionStart(**json.loads(event.get("body", "{}")))
    except (ValidationError, json.JSONDecodeError) as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")
    user_id = user.get("user_id", "unknown")
    now = datetime.utcnow()

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, status FROM cameras WHERE id = %s AND org_id = %s", (body.camera_id, org_id))
        camera = cur.fetchone()
        if not camera:
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Camera not found", "data": None})}

        cur.execute(
            "INSERT INTO sessions (camera_id, org_id, user_id, status, started_at) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (body.camera_id, org_id, user_id, SessionStatus.ACTIVE.value, now)
        )
        conn.commit()
        session_id = cur.fetchone()[0]

        session = Session(
            id=session_id, camera_id=body.camera_id, org_id=org_id, user_id=user_id,
            status=SessionStatus.ACTIVE, started_at=now, ended_at=None, duration_seconds=0
        ).model_dump()
        return {"success": True, "data": session, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def stop_session(event, context):
    session_id = event.get("pathParameters", {}).get("session_id")
    user = event.get("user", {})
    org_id = user.get("org_id", "default")
    now = datetime.utcnow()

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, started_at FROM sessions WHERE id = %s AND org_id = %s AND status = %s",
                   (session_id, org_id, SessionStatus.ACTIVE.value))
        row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Session not found or already ended", "data": None})}

        duration = int((now - row[1]).total_seconds())
        cur.execute("UPDATE sessions SET status = %s, ended_at = %s, duration_seconds = %s WHERE id = %s",
                   (SessionStatus.ENDED.value, now, duration, session_id))
        conn.commit()

        cur.execute("SELECT id, camera_id, org_id, user_id, status, started_at, ended_at, duration_seconds FROM sessions WHERE id = %s", (session_id,))
        row = cur.fetchone()
        session = Session(
            id=row[0], camera_id=row[1], org_id=row[2], user_id=row[3],
            status=SessionStatus(row[4]), started_at=row[5], ended_at=row[6], duration_seconds=row[7]
        ).model_dump()
        return {"success": True, "data": session, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def list_sessions(event, context):
    try:
        params = PaginationParams(**event.get("queryStringParameters", {}) or {})
    except ValidationError as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")
    offset = (params.page - 1) * params.limit

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, camera_id, org_id, user_id, status, started_at, ended_at, duration_seconds FROM sessions WHERE org_id = %s ORDER BY started_at DESC LIMIT %s OFFSET %s",
            (org_id, params.limit, offset)
        )
        rows = cur.fetchall()
        cur.execute("SELECT COUNT(*) FROM sessions WHERE org_id = %s", (org_id,))
        total = cur.fetchone()[0]

        sessions = [
            Session(
                id=row[0], camera_id=row[1], org_id=row[2], user_id=row[3],
                status=SessionStatus(row[4]), started_at=row[5], ended_at=row[6], duration_seconds=row[7]
            ).model_dump()
            for row in rows
        ]
        return {"success": True, "data": {"items": sessions, "total": total, "page": params.page, "limit": params.limit}, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def get_session(event, context):
    session_id = event.get("pathParameters", {}).get("session_id")
    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, camera_id, org_id, user_id, status, started_at, ended_at, duration_seconds FROM sessions WHERE id = %s AND org_id = %s",
                   (session_id, org_id))
        row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Session not found", "data": None})}

        session = Session(
            id=row[0], camera_id=row[1], org_id=row[2], user_id=row[3],
            status=SessionStatus(row[4]), started_at=row[5], ended_at=row[6], duration_seconds=row[7]
        ).model_dump()
        return {"success": True, "data": session, "error": None}
    finally:
        pool.putconn(conn)
