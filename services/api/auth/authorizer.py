import os
import json
from config import get_cognito_config


def build_arn(region: str, account: str, user_pool_id: str) -> str:
    return f"arn:aws:cognito-idp:{region}:{account}:userpool/{user_pool_id}"


def generate_policy(effect: str, resource: str, principal_id: str) -> dict:
    return {
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": effect,
                    "Resource": resource,
                }
            ]
        },
        "principalId": principal_id,
    }


def lambda_authorizer(event, context):
    config = get_cognito_config()
    token = event.get("queryStringParameters", {}).get("token") or event.get("headers", {}).get("Authorization", "").split()[-1]

    if not token:
        return generate_policy("Deny", event["methodArn"], "anonymous")

    try:
        import jwt
        from config import get_cognito_config
        config = get_cognito_config()
        payload = jwt.decode(token, options={"verify_signature": False}, audience=config["client_id"])
        user_id = payload.get("sub", "unknown")
        return generate_policy("Allow", event["methodArn"], user_id)
    except Exception:
        return generate_policy("Deny", event["methodArn"], "invalid")
