import json
import boto3
from config import get_lambda_config


dynamodb = boto3.resource("dynamodb")
config = get_lambda_config()
table = dynamodb.Table(config["table_name"])


def handle_connect(event, context):
    connection_id = event.get("connectionId")
    return {"statusCode": 200, "body": json.dumps({"success": True, "message": "Connected", "data": None})}


def handle_disconnect(event, context):
    connection_id = event.get("connectionId")
    return {"statusCode": 200, "body": json.dumps({"success": True, "message": "Disconnected", "data": None})}


def handle_message(event, context):
    connection_id = event.get("connectionId")
    try:
        body = json.loads(event.get("body", "{}"))
        message_type = body.get("type")
        payload = body.get("payload", {})

        if message_type == "event_alert":
            table.put_item(Item={
                "pk": f"event#{payload.get('event_id')}",
                "sk": connection_id,
                "connection_id": connection_id,
                "alert_type": payload.get("alert_type"),
                "severity": payload.get("severity"),
                "created_at": payload.get("created_at"),
            })
        elif message_type == "session_update":
            table.put_item(Item={
                "pk": f"session#{payload.get('session_id')}",
                "sk": connection_id,
                "connection_id": connection_id,
                "status": payload.get("status"),
            })

        return {"statusCode": 200, "body": json.dumps({"success": True, "message": "Message processed", "data": None})}
    except Exception as e:
        return {"statusCode": 400, "body": json.dumps({"success": False, "error": str(e), "data": None})}


def websocket_handler(event, context):
    route_key = event.get("routeKey")

    if route_key == "$connect":
        return handle_connect(event, context)
    elif route_key == "$disconnect":
        return handle_disconnect(event, context)
    elif route_key == "send_message":
        return handle_message(event, context)
    else:
        return {"statusCode": 404, "body": json.dumps({"success": False, "error": "Route not found", "data": None})}
