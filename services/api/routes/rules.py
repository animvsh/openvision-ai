from . import api_handler, get_pool, ValidationError, AuthError
from auth.middleware import require_auth, extract_token_from_event, validate_jwt_token, AuthError as AuthErrorMiddleware
from models.schemas import RuleCreate, RuleUpdate, PaginationParams
from models.types import Rule, EventSeverity
from pydantic import ValidationError
from datetime import datetime
import json


@require_auth
def list_rules(event, context):
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
            "SELECT id, org_id, name, description, mode, severity, conditions, actions, enabled, created_at, updated_at FROM rules WHERE org_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (org_id, params.limit, offset)
        )
        rows = cur.fetchall()
        cur.execute("SELECT COUNT(*) FROM rules WHERE org_id = %s", (org_id,))
        total = cur.fetchone()[0]

        rules = [
            Rule(
                id=row[0], org_id=row[1], name=row[2], description=row[3], mode=row[4],
                severity=EventSeverity(row[5]), conditions=row[6], actions=row[7],
                enabled=row[8], created_at=row[9], updated_at=row[10]
            ).model_dump()
            for row in rows
        ]
        return {"success": True, "data": {"items": rules, "total": total, "page": params.page, "limit": params.limit}, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def get_rule(event, context):
    rule_id = event.get("pathParameters", {}).get("rule_id")
    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, org_id, name, description, mode, severity, conditions, actions, enabled, created_at, updated_at FROM rules WHERE id = %s AND org_id = %s",
            (rule_id, org_id)
        )
        row = cur.fetchone()
        if not row:
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Rule not found", "data": None})}

        rule = Rule(
            id=row[0], org_id=row[1], name=row[2], description=row[3], mode=row[4],
            severity=EventSeverity(row[5]), conditions=row[6], actions=row[7],
            enabled=row[8], created_at=row[9], updated_at=row[10]
        ).model_dump()
        return {"success": True, "data": rule, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def create_rule(event, context):
    try:
        body = RuleCreate(**json.loads(event.get("body", "{}")))
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
            "INSERT INTO rules (org_id, name, description, mode, severity, conditions, actions, enabled, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (org_id, body.name, body.description, body.mode, body.severity, json.dumps(body.conditions), body.actions, body.enabled, now, now)
        )
        conn.commit()
        rule_id = cur.fetchone()[0]

        rule = Rule(
            id=rule_id, org_id=org_id, name=body.name, description=body.description,
            mode=body.mode, severity=EventSeverity(body.severity), conditions=body.conditions,
            actions=body.actions, enabled=body.enabled, created_at=now, updated_at=now
        ).model_dump()
        return {"success": True, "data": rule, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def update_rule(event, context):
    rule_id = event.get("pathParameters", {}).get("rule_id")
    try:
        body = RuleUpdate(**json.loads(event.get("body", "{}")))
    except (ValidationError, json.JSONDecodeError) as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}

    user = event.get("user", {})
    org_id = user.get("org_id", "default")
    now = datetime.utcnow()

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM rules WHERE id = %s AND org_id = %s", (rule_id, org_id))
        if not cur.fetchone():
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Rule not found", "data": None})}

        updates = []
        values = []
        if body.name is not None:
            updates.append("name = %s")
            values.append(body.name)
        if body.description is not None:
            updates.append("description = %s")
            values.append(body.description)
        if body.severity is not None:
            updates.append("severity = %s")
            values.append(body.severity)
        if body.conditions is not None:
            updates.append("conditions = %s")
            values.append(json.dumps(body.conditions))
        if body.actions is not None:
            updates.append("actions = %s")
            values.append(body.actions)
        if body.enabled is not None:
            updates.append("enabled = %s")
            values.append(body.enabled)

        updates.append("updated_at = %s")
        values.append(now)
        values.extend([rule_id, org_id])

        cur.execute(f"UPDATE rules SET {', '.join(updates)} WHERE id = %s AND org_id = %s", values)
        conn.commit()

        cur.execute("SELECT id, org_id, name, description, mode, severity, conditions, actions, enabled, created_at, updated_at FROM rules WHERE id = %s", (rule_id,))
        row = cur.fetchone()
        rule = Rule(
            id=row[0], org_id=row[1], name=row[2], description=row[3], mode=row[4],
            severity=EventSeverity(row[5]), conditions=row[6], actions=row[7],
            enabled=row[8], created_at=row[9], updated_at=row[10]
        ).model_dump()
        return {"success": True, "data": rule, "error": None}
    finally:
        pool.putconn(conn)


@require_auth
def delete_rule(event, context):
    rule_id = event.get("pathParameters", {}).get("rule_id")
    user = event.get("user", {})
    org_id = user.get("org_id", "default")

    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM rules WHERE id = %s AND org_id = %s RETURNING id", (rule_id, org_id))
        if not cur.fetchone():
            return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Rule not found", "data": None})}
        conn.commit()
        return {"success": True, "data": {"deleted": rule_id}, "error": None}
    finally:
        pool.putconn(conn)
