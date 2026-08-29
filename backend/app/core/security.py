import base64
import hashlib
import hmac
import json
import os
import secrets
import time


SECRET_KEY = os.getenv(
    "AUTH_SECRET_KEY",
    "change-this-secret-key"
)

TOKEN_EXPIRE_SECONDS = 60 * 60 * 24


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        310000
    )

    return (
        base64.urlsafe_b64encode(salt).decode()
        + ":"
        + base64.urlsafe_b64encode(password_hash).decode()
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_b64, hash_b64 = stored_hash.split(":")

        salt = base64.urlsafe_b64decode(salt_b64)
        expected_hash = base64.urlsafe_b64decode(hash_b64)

        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            310000
        )

        return hmac.compare_digest(actual_hash, expected_hash)

    except Exception:
        return False


def create_token(user_id: int) -> str:
    payload = {
        "user_id": user_id,
        "exp": int(time.time()) + TOKEN_EXPIRE_SECONDS
    }

    payload_json = json.dumps(
        payload,
        separators=(",", ":")
    ).encode()

    payload_b64 = base64.urlsafe_b64encode(
        payload_json
    ).decode().rstrip("=")

    signature = hmac.new(
        SECRET_KEY.encode(),
        payload_b64.encode(),
        hashlib.sha256
    ).digest()

    signature_b64 = base64.urlsafe_b64encode(
        signature
    ).decode().rstrip("=")

    return f"{payload_b64}.{signature_b64}"


def verify_token(token: str):
    try:
        payload_b64, signature_b64 = token.split(".")

        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            payload_b64.encode(),
            hashlib.sha256
        ).digest()

        actual_signature = base64.urlsafe_b64decode(
            signature_b64 + "=" * (-len(signature_b64) % 4)
        )

        if not hmac.compare_digest(
            expected_signature,
            actual_signature
        ):
            return None

        payload = json.loads(
            base64.urlsafe_b64decode(
                payload_b64 + "=" * (-len(payload_b64) % 4)
            )
        )

        if payload["exp"] < int(time.time()):
            return None

        return payload

    except Exception:
        return None