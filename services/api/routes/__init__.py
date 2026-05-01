import json
import psycopg2
from psycopg2.pool import ThreadedConnectionPool
from config import get_db_config

pool = None


def get_pool():
    global pool
    if pool is None:
        config = get_db_config()
        pool = ThreadedConnectionPool(1, 10, **config)
    return pool


def api_handler(func):
    def wrapper(event, context):
        try:
            result = func(event, context)
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps(result, default=str),
            }
        except ValidationError as e:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"success": False, "error": str(e), "data": None}),
            }
        except AuthError as e:
            return {
                "statusCode": e.status_code,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"success": False, "error": e.message, "data": None}),
            }
        except Exception as e:
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"success": False, "error": "Internal server error", "data": None}),
            }
    wrapper.__name__ = func.__name__
    return wrapper


class ValidationError(Exception):
    pass


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def validate_input(schema, data):
    try:
        return schema(**data)
    except Exception as e:
        raise ValidationError(str(e))
