from . import api_handler, get_pool, ValidationError, AuthError
from auth.middleware import require_auth, extract_token_from_event, validate_jwt_token, AuthError as AuthErrorMiddleware
from models.schemas import CameraCreate, CameraUpdate, PaginationParams, SuccessResponse, ErrorResponse
from models.types import Camera, CameraStatus
from pydantic import ValidationError
from datetime import datetime
import json


def get_user(event):
    token = extract_token_from_event(event)
    if not token:
        raise AuthErrorMiddleware("Missing authorization token")
    return validate_jwt_token(token)


@require_auth
def list_cameras(event, context):
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
            "SELECT id, name, location, org_id, status, rtsp_url, created_at, updated_at FROM cameras WHERE org_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (org_id, params.limit, offset)
        )
        rows = cur.fetchall()
        cur.execute("SELECT COUNT(*) FROM cameras WHERE org_id = %s", (org_id,))
        total = cur.fetchone()[0]

        cameras = [
            Camera(
                id=row[0], name=row[1], location=row[2], org_id=row[3],
                status=CameraStatus(row[4]), rtsp_url=row[5],
                created_at=row[6], updated_at=row[7]
            ).model_dump()
            for row in rows
        ]

        return {"success": True, "data": {"items": cameras, "total": total, "page": params.page, "limit": params.limit}, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def get_camera(event, context):
    camera_id = event.get("pathParameters", {}).get("camera_id")
    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, location, org_id, status, rtsp_url, created_at, updated_at FROM cameras WHERE id = %s AND org_id = %s",
            (camera_id, org_id)
        )
        row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Camera not found", "data": None})}

        camera = Camera(
            id=row[0], name=row[1], location=row[2], org_id=row[3],
            status=CameraStatus(row[4]), rtsp_url=row[5],
            created_at=row[6], updated_at=row[7]
        ).model_dump()
        return {"success": True, "data": camera, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def create_camera(event, context):
    try:
        body = CameraCreate(**json.loads(event.get("body", "{}")))
    except (ValidationError, json.JSONDecodeError) as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")
    now = datetime.utcnow()

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO cameras (name, location, org_id, status, rtsp_url, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (body.name, body.location, org_id, CameraStatus.ACTIVE.value, body.rtsp_url, now, now)
        )
        conn.commit()
        camera_id = cur.fetchone()[0]

        camera = Camera(
            id=camera_id, name=body.name, location=body.location, org_id=org_id,
            status=CameraStatus.ACTIVE, rtsp_url=body.rtsp_url,
            created_at=now, updated_at=now
        ).model_dump()
        return {"success": True, "data": camera, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def update_camera(event, context):
    camera_id = event.get("pathParameters", {}).get("camera_id")
    try:
        body = CameraUpdate(**json.loads(event.get("body", "{}")))
    except (ValidationError, json.JSONDecodeError) as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")
    now = datetime.utcnow()

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM cameras WHERE id = %s AND org_id = %s", (camera_id, org_id))
        if not cur.fetchone():
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Camera not found", "data": None})}

        updates = []
        values = []
        if body.name is not None:
            updates.append("name = %s")
            values.append(body.name)
        if body.location is not None:
            updates.append("location = %s")
            values.append(body.location)
        if body.status is not None:
            updates.append("status = %s")
            values.append(body.status)
        if body.rtsp_url is not None:
            updates.append("rtsp_url = %s")
            values.append(body.rtsp_url)

        updates.append("updated_at = %s")
        values.append(now)
        values.extend([camera_id, org_id])

        cur.execute(f"UPDATE cameras SET {', '.join(updates)} WHERE id = %s AND org_id = %s", values)
        conn.commit()

        cur.execute("SELECT id, name, location, org_id, status, rtsp_url, created_at, updated_at FROM cameras WHERE id = %s", (camera_id,))
        row = cur.fetchone()
        camera = Camera(
            id=row[0], name=row[1], location=row[2], org_id=row[3],
            status=CameraStatus(row[4]), rtsp_url=row[5],
            created_at=row[6], updated_at=row[7]
        ).model_dump()
        return {"success": True, "data": camera, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def delete_camera(event, context):
    camera_id = event.get("pathParameters", {}).get("camera_id")
    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM cameras WHERE id = %s AND org_id = %s RETURNING id", (camera_id, org_id))
        if not cur.fetchone():
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Camera not found", "data": None})}
        conn.commit()
        return {"success": True, "data": {"deleted": camera_id}, "error": None}
    finally:
        pool.putconn(conn)
