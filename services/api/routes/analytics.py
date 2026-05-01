from . import api_handler, get_pool, ValidationError, AuthError
from auth.middleware import require_auth, extract_token_from_event, validate_jwt_token, AuthError as AuthErrorMiddleware
from models.schemas import PaginationParams
from models.types import AnalyticsOverview, CameraAnalytics, SessionAnalytics, EventSeverity
from pydantic import ValidationError
from datetime import datetime, timedelta
import json


@require_auth
def overview(event, context):
    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM events WHERE org_id = %s", (org_id,))
        total_events = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM sessions WHERE org_id = %s AND status = 'active'", (org_id,))
        active_sessions = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM cameras WHERE org_id = %s AND status = 'active'", (org_id,))
        cameras_online = cur.fetchone()[0]

        cur.execute("SELECT severity, COUNT(*) FROM events WHERE org_id = %s GROUP BY severity", (org_id,))
        severity_rows = cur.fetchall()
        events_by_severity = {row[0]: row[1] for row in severity_rows}

        recent_threshold = datetime.utcnow() - timedelta(hours=24)
        cur.execute("SELECT COUNT(*) FROM events WHERE org_id = %s AND created_at >= %s", (org_id, recent_threshold))
        recent_alerts = cur.fetchone()[0]

        overview = AnalyticsOverview(
            total_events=total_events,
            active_sessions=active_sessions,
            cameras_online=cameras_online,
            events_by_severity=events_by_severity,
            recent_alerts=recent_alerts
        ).model_dump()
        return {"success": True, "data": overview, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def camera_analytics(event, context):
    camera_id = event.get("pathParameters", {}).get("camera_id")
    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM events WHERE camera_id = %s AND org_id = %s", (camera_id, org_id))
        event_count = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM sessions WHERE camera_id = %s AND org_id = %s", (camera_id, org_id))
        session_count = cur.fetchone()[0]

        cur.execute("SELECT AVG(duration_seconds) FROM sessions WHERE camera_id = %s AND org_id = %s AND duration_seconds IS NOT NULL", (camera_id, org_id))
        avg_duration = cur.fetchone()[0] or 0
        avg_duration_minutes = avg_duration / 60 if avg_duration else 0

        cur.execute("SELECT severity, COUNT(*) FROM events WHERE camera_id = %s AND org_id = %s GROUP BY severity ORDER BY COUNT(*) DESC LIMIT 1", (camera_id, org_id))
        top_severity_row = cur.fetchone()
        top_severity = top_severity_row[0] if top_severity_row else EventSeverity.LOW.value

        cur.execute("""
            SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*)
            FROM events WHERE camera_id = %s AND org_id = %s
            GROUP BY EXTRACT(HOUR FROM created_at)
            ORDER BY hour
        """, (camera_id, org_id))
        events_by_hour_rows = cur.fetchall()
        events_by_hour = {str(int(row[0])): row[1] for row in events_by_hour_rows}

        analytics = CameraAnalytics(
            camera_id=camera_id,
            event_count=event_count,
            session_count=session_count,
            avg_duration_minutes=avg_duration_minutes,
            top_severity=EventSeverity(top_severity),
            events_by_hour=events_by_hour
        ).model_dump()
        return {"success": True, "data": analytics, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def session_analytics(event, context):
    session_id = event.get("pathParameters", {}).get("session_id")
    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM events WHERE session_id = %s AND org_id = %s", (session_id, org_id))
        event_count = cur.fetchone()[0]

        cur.execute("SELECT severity, COUNT(*) FROM events WHERE session_id = %s AND org_id = %s GROUP BY severity", (session_id, org_id))
        severity_rows = cur.fetchall()
        severity_breakdown = {row[0]: row[1] for row in severity_rows}

        cur.execute("SELECT duration_seconds FROM sessions WHERE id = %s AND org_id = %s", (session_id, org_id))
        duration_row = cur.fetchone()
        duration_minutes = duration_row[0] / 60 if duration_row and duration_row[0] else 0

        cur.execute("SELECT ai_summary FROM events WHERE session_id = %s AND org_id = %s AND ai_summary IS NOT NULL", (session_id, org_id))
        ai_summaries = [row[0] for row in cur.fetchall()]

        analytics = SessionAnalytics(
            session_id=session_id,
            event_count=event_count,
            severity_breakdown=severity_breakdown,
            duration_minutes=duration_minutes,
            ai_summaries=ai_summaries
        ).model_dump()
        return {"success": True, "data": analytics, "error": None}
    finally:
        pool.putconn(conn)
