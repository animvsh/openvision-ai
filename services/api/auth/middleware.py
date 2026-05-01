import jwt
import boto3
from functools import lru_cache
from typing import Optional
from config import get_cognito_config


@lru_cache()
def get_cognito_client():
    config = get_cognito_config()
    return boto3.client("cognito-idp", region=config["region"])


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def extract_token_from_event(event: dict) -> Optional[str]:
    auth_header = event.get("headers", {}).get("Authorization") or event.get("headers", {}).get("authorization")
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def validate_jwt_token(token: str) -> dict:
    config = get_cognito_config()
    try:
        payload = jwt.decode(
            token,
            options={"verify_signature": False},
            audience=config["client_id"],
        )
        return {
            "user_id": payload.get("sub"),
            "org_id": payload.get("custom:org_id", payload.get("org_id", "default")),
            "email": payload.get("email", ""),
            "username": payload.get("username", payload.get("cognito:username", "")),
        }
    except jwt.ExpiredSignatureError:
        raise AuthError("Token has expired", 401)
    except jwt.InvalidTokenError as e:
        raise AuthError(f"Invalid token: {str(e)}", 401)


def require_auth(func):
    def wrapper(event, context):
        token = extract_token_from_event(event)
        if not token:
            return {"statusCode": 401, "body": '{"success": false, "error": "Missing authorization token"}'}
        try:
            user = validate_jwt_token(token)
            event["user"] = user
        except AuthError as e:
            return {"statusCode": e.status_code, "body": f'{{"success": false, "error": "{e.message}"}}'}
        return func(event, context)
    wrapper.__name__ = func.__name__
    return wrapper
