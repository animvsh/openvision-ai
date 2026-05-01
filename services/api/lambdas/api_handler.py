import json
from routes import cameras, sessions, events, rules, analytics, ai


def lambda_handler(event, context):
    path = event.get("path", "")
    method = event.get("httpMethod", "")

    if path == "/cameras" and method == "GET":
        return cameras.list_cameras(event, context)
    elif path == "/cameras" and method == "POST":
        return cameras.create_camera(event, context)
    elif path.startswith("/cameras/") and method == "GET":
        event["pathParameters"] = {"camera_id": path.split("/")[-1]}
        return cameras.get_camera(event, context)
    elif path.startswith("/cameras/") and method == "PUT":
        event["pathParameters"] = {"camera_id": path.split("/")[-1]}
        return cameras.update_camera(event, context)
    elif path.startswith("/cameras/") and method == "DELETE":
        event["pathParameters"] = {"camera_id": path.split("/")[-1]}
        return cameras.delete_camera(event, context)

    elif path == "/sessions" and method == "GET":
        return sessions.list_sessions(event, context)
    elif path == "/sessions" and method == "POST":
        return sessions.start_session(event, context)
    elif path.startswith("/sessions/") and method == "GET":
        event["pathParameters"] = {"session_id": path.split("/")[-1]}
        return sessions.get_session(event, context)
    elif path.startswith("/sessions/") and method == "DELETE":
        event["pathParameters"] = {"session_id": path.split("/")[-1]}
        return sessions.stop_session(event, context)

    elif path == "/events" and method == "GET":
        return events.list_events(event, context)
    elif path.startswith("/events/") and method == "GET":
        event["pathParameters"] = {"event_id": path.split("/")[-1]}
        return events.get_event(event, context)
    elif path == "/events/escalate" and method == "POST":
        return events.escalate_event(event, context)
    elif path == "/events/dismiss" and method == "POST":
        return events.dismiss_event(event, context)

    elif path == "/rules" and method == "GET":
        return rules.list_rules(event, context)
    elif path == "/rules" and method == "POST":
        return rules.create_rule(event, context)
    elif path.startswith("/rules/") and method == "GET":
        event["pathParameters"] = {"rule_id": path.split("/")[-1]}
        return rules.get_rule(event, context)
    elif path.startswith("/rules/") and method == "PUT":
        event["pathParameters"] = {"rule_id": path.split("/")[-1]}
        return rules.update_rule(event, context)
    elif path.startswith("/rules/") and method == "DELETE":
        event["pathParameters"] = {"rule_id": path.split("/")[-1]}
        return rules.delete_rule(event, context)

    elif path == "/analytics/overview" and method == "GET":
        return analytics.overview(event, context)
    elif path.startswith("/analytics/camera/") and method == "GET":
        event["pathParameters"] = {"camera_id": path.split("/")[-1]}
        return analytics.camera_analytics(event, context)
    elif path.startswith("/analytics/session/") and method == "GET":
        event["pathParameters"] = {"session_id": path.split("/")[-1]}
        return analytics.session_analytics(event, context)

    elif path == "/ai/summarize-event" and method == "POST":
        return ai.summarize_event(event, context)
    elif path == "/ai/summarize-session" and method == "POST":
        return ai.summarize_session(event, context)

    return {
        "statusCode": 404,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"success": False, "error": "Endpoint not found", "data": None}),
    }
