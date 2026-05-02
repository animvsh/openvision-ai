"""
OpenVision AI API - FastAPI Web Service
Converted from AWS Lambda to Railway-compatible web service
"""
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
import json
from datetime import datetime

# Import route handlers from original Lambda code
from routes import cameras, sessions, events, rules, analytics, ai
from auth.middleware import require_auth, extract_token_from_event, validate_jwt_token, AuthError as AuthErrorMiddleware
from routes import ValidationError as RouteValidationError

app = FastAPI(title="OpenVision AI API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper to convert FastAPI request to Lambda-like event
async def request_to_event(request: Request) -> dict:
    body = None
    if request.method in ["POST", "PUT", "PATCH"]:
        body_bytes = await request.body()
        body = body_bytes.decode("utf-8") if body_bytes else None

    path = request.url.path
    query_params = dict(request.query_params) if request.query_params else {}

    headers = {}
    for header, value in request.headers.items():
        headers[header.lower()] = value

    return {
        "path": path,
        "httpMethod": request.method,
        "queryStringParameters": query_params,
        "headers": headers,
        "body": body,
    }


# Helper to call Lambda handler and convert response
async def call_handler(func, event):
    try:
        # For sync handlers that return dict
        result = func(event, None)
        if isinstance(result, dict):
            if "statusCode" in result:
                status = result.pop("statusCode")
                body = result.pop("body", "{}")
                if isinstance(body, str):
                    body = json.loads(body)
                return JSONResponse(content=body, status_code=status)
            return result
        return result
    except RouteValidationError as e:
        return JSONResponse(content={"success": False, "error": str(e)}, status_code=400)
    except AuthErrorMiddleware as e:
        return JSONResponse(content={"success": False, "error": e.message}, status_code=e.status_code)
    except Exception as e:
        return JSONResponse(content={"success": False, "error": "Internal server error"}, status_code=500)


# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "openvision-api"}


# Camera routes
@app.get("/cameras")
async def list_cameras(request: Request):
    event = await request_to_event(request)
    return await call_handler(cameras.list_cameras, event)


@app.post("/cameras")
async def create_camera(request: Request):
    event = await request_to_event(request)
    return await call_handler(cameras.create_camera, event)


@app.get("/cameras/{camera_id}")
async def get_camera(request: Request, camera_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"camera_id": camera_id}
    return await call_handler(cameras.get_camera, event)


@app.put("/cameras/{camera_id}")
async def update_camera(request: Request, camera_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"camera_id": camera_id}
    return await call_handler(cameras.update_camera, event)


@app.delete("/cameras/{camera_id}")
async def delete_camera(request: Request, camera_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"camera_id": camera_id}
    return await call_handler(cameras.delete_camera, event)


# Session routes
@app.get("/sessions")
async def list_sessions(request: Request):
    event = await request_to_event(request)
    return await call_handler(sessions.list_sessions, event)


@app.post("/sessions")
async def start_session(request: Request):
    event = await request_to_event(request)
    return await call_handler(sessions.start_session, event)


@app.get("/sessions/{session_id}")
async def get_session(request: Request, session_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"session_id": session_id}
    return await call_handler(sessions.get_session, event)


@app.delete("/sessions/{session_id}")
async def stop_session(request: Request, session_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"session_id": session_id}
    return await call_handler(sessions.stop_session, event)


# Event routes
@app.get("/events")
async def list_events(request: Request):
    event = await request_to_event(request)
    return await call_handler(events.list_events, event)


@app.get("/events/{event_id}")
async def get_event(request: Request, event_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"event_id": event_id}
    return await call_handler(events.get_event, event)


@app.post("/events/escalate")
async def escalate_event(request: Request):
    event = await request_to_event(request)
    return await call_handler(events.escalate_event, event)


@app.post("/events/dismiss")
async def dismiss_event(request: Request):
    event = await request_to_event(request)
    return await call_handler(events.dismiss_event, event)


# Rule routes
@app.get("/rules")
async def list_rules(request: Request):
    event = await request_to_event(request)
    return await call_handler(rules.list_rules, event)


@app.post("/rules")
async def create_rule(request: Request):
    event = await request_to_event(request)
    return await call_handler(rules.create_rule, event)


@app.get("/rules/{rule_id}")
async def get_rule(request: Request, rule_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"rule_id": rule_id}
    return await call_handler(rules.get_rule, event)


@app.put("/rules/{rule_id}")
async def update_rule(request: Request, rule_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"rule_id": rule_id}
    return await call_handler(rules.update_rule, event)


@app.delete("/rules/{rule_id}")
async def delete_rule(request: Request, rule_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"rule_id": rule_id}
    return await call_handler(rules.delete_rule, event)


# Analytics routes
@app.get("/analytics/overview")
async def analytics_overview(request: Request):
    event = await request_to_event(request)
    return await call_handler(analytics.overview, event)


@app.get("/analytics/camera/{camera_id}")
async def camera_analytics(request: Request, camera_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"camera_id": camera_id}
    return await call_handler(analytics.camera_analytics, event)


@app.get("/analytics/session/{session_id}")
async def session_analytics(request: Request, session_id: str):
    event = await request_to_event(request)
    event["pathParameters"] = {"session_id": session_id}
    return await call_handler(analytics.session_analytics, event)


# AI routes
@app.post("/ai/summarize-event")
async def ai_summarize_event(request: Request):
    event = await request_to_event(request)
    return await call_handler(ai.summarize_event, event)


@app.post("/ai/summarize-session")
async def ai_summarize_session(request: Request):
    event = await request_to_event(request)
    return await call_handler(ai.summarize_session, event)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)