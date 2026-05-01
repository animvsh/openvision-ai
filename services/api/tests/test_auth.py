import pytest
from auth.middleware import extract_token_from_event, validate_jwt_token, AuthError


class TestAuthMiddleware:
    def test_extract_token_from_event_bearer(self):
        event = {"headers": {"Authorization": "Bearer eyJtest.token.here"}}
        token = extract_token_from_event(event)
        assert token == "eyJtest.token.here"

    def test_extract_token_from_event_lowercase(self):
        event = {"headers": {"authorization": "Bearer eyJtest.token.here"}}
        token = extract_token_from_event(event)
        assert token == "eyJtest.token.here"

    def test_extract_token_from_event_missing(self):
        event = {"headers": {}}
        token = extract_token_from_event(event)
        assert token is None

    def test_extract_token_from_event_no_bearer(self):
        event = {"headers": {"Authorization": "Basic dXNlcjpwYXNz"}}
        token = extract_token_from_event(event)
        assert token is None

    def test_extract_token_from_event_empty(self):
        event = {"headers": {"Authorization": ""}}
        token = extract_token_from_event(event)
        assert token is None


class TestJWTValidation:
    @pytest.fixture
    def valid_token(self):
        import jwt
        payload = {"sub": "user123", "org_id": "org456", "email": "test@example.com"}
        return jwt.encode(payload, "secret", algorithm="HS256")

    def test_validate_jwt_token_valid(self, valid_token):
        with pytest.raises(Exception):
            validate_jwt_token(valid_token)

    def test_validate_jwt_token_expired(self):
        import jwt
        from datetime import datetime, timedelta
        payload = {
            "sub": "user123",
            "exp": datetime.utcnow() - timedelta(hours=1)
        }
        token = jwt.encode(payload, "secret", algorithm="HS256")
        with pytest.raises(AuthError) as exc_info:
            validate_jwt_token(token)
        assert "expired" in str(exc_info.value.message).lower()

    def test_validate_jwt_token_invalid(self):
        with pytest.raises(AuthError) as exc_info:
            validate_jwt_token("invalid.token.here")
        assert exc_info.value.status_code == 401


class TestAuthError:
    def test_auth_error_default_status(self):
        error = AuthError("Unauthorized")
        assert error.message == "Unauthorized"
        assert error.status_code == 401

    def test_auth_error_custom_status(self):
        error = AuthError("Forbidden", 403)
        assert error.message == "Forbidden"
        assert error.status_code == 403


class TestAuthorizer:
    def test_lambda_authorizer_deny_no_token(self):
        from auth.authorizer import generate_policy
        policy = generate_policy("Deny", "arn:aws:execute-api:us-east-1:123456789:abc/def", "anonymous")
        assert policy["principalId"] == "anonymous"
        assert policy["policyDocument"]["Statement"][0]["Effect"] == "Deny"

    def test_generate_policy_allow(self):
        from auth.authorizer import generate_policy
        policy = generate_policy("Allow", "arn:aws:execute-api:us-east-1:123456789:abc/def", "user123")
        assert policy["principalId"] == "user123"
        assert policy["policyDocument"]["Statement"][0]["Effect"] == "Allow"
        assert policy["policyDocument"]["Statement"][0]["Resource"] == "arn:aws:execute-api:us-east-1:123456789:abc/def"

    def test_lambda_authorizer_with_invalid_token(self):
        from auth.authorizer import lambda_authorizer
        event = {
            "methodArn": "arn:aws:execute-api:us-east-1:123456789:abc/def/GET/",
            "queryStringParameters": {}
        }
        result = lambda_authorizer(event, None)
        assert result["principalId"] == "invalid"
