"""Phone-verified donor authentication with revocable, DB-backed sessions."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import asyncpg
from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt

from mtc.config import settings

ALGORITHM = "HS256"
OTP_TTL_MINUTES = 5
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_SECONDS = 60
OTP_MAX_SENDS_PER_HOUR = 5


def phone_digest(phone: str) -> str:
    key = (settings.token_hmac_key_current or settings.jwt_secret).encode()
    if len(key) < 32:
        raise RuntimeError("A strong TOKEN_HMAC_KEY_CURRENT or JWT_SECRET is required")
    return hmac.new(key, phone.encode(), hashlib.sha256).hexdigest()


def donor_identity(phone_hash: str) -> str:
    key = (settings.ledger_hmac_key or settings.jwt_secret).encode()
    if len(key) < 32:
        raise RuntimeError("A strong LEDGER_HMAC_KEY or JWT_SECRET is required")
    return hmac.new(key, ("donor:" + phone_hash).encode(), hashlib.sha256).hexdigest()


def otp_digest(phone_hash: str, code: str) -> str:
    key = settings.jwt_secret.encode()
    return hmac.new(key, (phone_hash + ":" + code).encode(), hashlib.sha256).hexdigest()


async def create_donor_session(conn: asyncpg.Connection, donor_hash: str, phone_hash: str) -> dict:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=max(1, settings.donor_session_hours))
    row = await conn.fetchrow(
        """INSERT INTO donor_sessions (donor_hash, phone_hash, expires_at)
           VALUES ($1, $2, $3) RETURNING id""",
        donor_hash, phone_hash, expires_at,
    )
    sid = str(row["id"])
    token = jwt.encode(
        {"sub": donor_hash, "sid": sid, "kind": "donor", "exp": expires_at},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )
    return {"session_token": token, "expires_at": expires_at.isoformat(), "session_id": sid}


async def verify_donor_token(conn: asyncpg.Connection, token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
    except JWTError:
        return None
    if payload.get("kind") != "donor":
        return None
    sid, donor_hash = payload.get("sid"), payload.get("sub")
    if not sid or not donor_hash:
        return None
    row = await conn.fetchrow(
        """SELECT id, donor_hash, expires_at, revoked_at
           FROM donor_sessions WHERE id = $1""",
        sid,
    )
    if row is None or row["revoked_at"] is not None:
        return None
    if row["expires_at"] <= datetime.now(timezone.utc) or row["donor_hash"] != donor_hash:
        return None
    return {"session_id": str(row["id"]), "donor_hash": row["donor_hash"],
            "expires_at": row["expires_at"].isoformat()}


async def get_current_donor(
    authorization: str | None = Header(None, alias="Authorization"),
    conn: asyncpg.Connection = Depends(lambda: None),
) -> dict:
    # The dependency is rebound to the shared DB connection below to avoid
    # accepting identity from any caller-controlled donor-hash header.
    raise RuntimeError("get_current_donor must be wired through donor_session_dependency")


def donor_session_dependency(get_conn):
    async def _dependency(
        authorization: str | None = Header(None, alias="Authorization"),
        conn: asyncpg.Connection = Depends(get_conn),
    ) -> dict:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(401, "Donor sign-in required")
        session = await verify_donor_token(conn, authorization[7:].strip())
        if session is None:
            raise HTTPException(401, "Invalid or expired donor session")
        return session
    return _dependency


async def revoke_donor_session(conn: asyncpg.Connection, session_id: str) -> None:
    await conn.execute(
        "UPDATE donor_sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL",
        session_id,
    )
