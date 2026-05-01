import os
from functools import lru_cache


@lru_cache()
def get_db_config() -> dict:
    return {
        "host": os.environ.get("DB_HOST", "localhost"),
        "port": int(os.environ.get("DB_PORT", "5432")),
        "database": os.environ.get("DB_NAME", "secureos"),
        "user": os.environ.get("DB_USER", "postgres"),
        "password": os.environ.get("DB_PASSWORD", ""),
    }


@lru_cache()
def get_aws_region() -> str:
    return os.environ.get("AWS_REGION", "us-east-1")


@lru_cache()
def get_cognito_config() -> dict:
    return {
        "user_pool_id": os.environ.get("COGNITO_USER_POOL_ID", ""),
        "client_id": os.environ.get("COGNITO_CLIENT_ID", ""),
        "region": os.environ.get("AWS_REGION", "us-east-1"),
    }


@lru_cache()
def get_lambda_config() -> dict:
    return {
        "table_name": os.environ.get("DYNAMODB_TABLE", "secureos-events"),
        "websocket_url": os.environ.get("WEBSOCKET_URL", ""),
    }


@lru_cache()
def get_api_config() -> dict:
    return {
        "stage": os.environ.get("API_STAGE", "dev"),
        "cors_origins": os.environ.get("CORS_ORIGINS", "*").split(","),
    }
