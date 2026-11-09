"""Donor phone OTP sign-in and session management."""
import secrets
from datetime import datetime, timedelta, timezone

import asyncpg
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field

from mtc.auth.donor import (
    create_donor_session, donor_identity, otp_digest, phone_digest,
    revoke_donor_session, verify_donor_token,
)
from mtc.db.main import get_conn
from mtc.sms.service import normalize_phone, send_sms
from mtc.rate_limit.counter import check_ip_rate_limit, RateLimitExceeded

router = APIRouter(prefix="/donor-auth", tags=["donor-auth"])


class PhoneBody(BaseModel):
    phone: str = Field(..., min_length=9, max_length=20)


class VerifyBody(PhoneBody):
    code: str = Field(..., pattern=r"^\d{6}$")


@router.post("/otp")
async def request_otp(body: PhoneBody, request: Request, conn: asyncpg.Connection = Depends(get_conn)):
    try:
        await check_ip_rate_limit(conn, ip_address=request.client.host, endpoint="donor_otp")
    except RateLimitExceeded as exc:
        raise HTTPException(429, detail=exc.reason) from exc
    try:
        phone = normalize_phone(body.phone)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    phash = phone_digest(phone)
    now = datetime.now(timezone.utc)
    code = f"{secrets.randbelow(1_000_000):06d}"

    async with conn.transaction():
        await conn.execute("SELECT pg_advisory_xact_lock(hashtext($1))", phash)
        old = await conn.fetchrow(
            "SELECT * FROM donor_otp_challenges WHERE phone_hash = $1 FOR UPDATE", phash
        )
        if old and old["resend_after"] > now:
            raise HTTPException(429, "Please wait before requesting another code")
        if old and old["window_started_at"] > now - timedelta(hours=1) and old["send_count"] >= 5:
            raise HTTPException(429, "Too many codes requested. Try again in an hour")
        send_count = old["send_count"] + 1 if old and old["window_started_at"] > now - timedelta(hours=1) else 1
        window_start = old["window_started_at"] if old and old["window_started_at"] > now - timedelta(hours=1) else now
        await conn.execute(
            """INSERT INTO donor_otp_challenges
               (phone_hash, code_hash, expires_at, attempts, send_count, window_started_at, resend_after)
               VALUES ($1, $2, $3, 0, $4, $5, $6)
               ON CONFLICT (phone_hash) DO UPDATE SET
                 code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at,
                 attempts = 0, send_count = EXCLUDED.send_count,
                 window_started_at = EXCLUDED.window_started_at,
                 resend_after = EXCLUDED.resend_after""",
            phash, otp_digest(phash, code), now + timedelta(minutes=5),
            send_count, window_start, now + timedelta(seconds=60),
        )

    try:
        result = await send_sms(phone=phone, message=f"Your Mutual Circle verification code is {code}. It expires in 5 minutes. Do not share it.")
    except RuntimeError as exc:
        await conn.execute("UPDATE donor_otp_challenges SET resend_after = now() WHERE phone_hash = $1 AND code_hash = $2", phash, otp_digest(phash, code))
        raise HTTPException(503, "SMS delivery is temporarily unavailable") from exc
    if not result["ok"]:
        await conn.execute("UPDATE donor_otp_challenges SET resend_after = now() WHERE phone_hash = $1 AND code_hash = $2", phash, otp_digest(phash, code))
        raise HTTPException(503, "SMS could not be sent. Please try again later")
    return {"ok": True, "message": "If the number can receive SMS, a verification code has been sent."}


@router.post("/verify")
async def verify_otp(body: VerifyBody, request: Request, conn: asyncpg.Connection = Depends(get_conn)):
    try:
        await check_ip_rate_limit(conn, ip_address=request.client.host, endpoint="donor_verify")
    except RateLimitExceeded as exc:
        raise HTTPException(429, detail=exc.reason) from exc
    try:
        phone = normalize_phone(body.phone)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    phash = phone_digest(phone)
    now = datetime.now(timezone.utc)
    invalid_status = None
    session = None
    donor_hash = None
    async with conn.transaction():
        challenge = await conn.fetchrow(
            "SELECT * FROM donor_otp_challenges WHERE phone_hash = $1 FOR UPDATE", phash
        )
        if challenge is None or challenge["expires_at"] <= now:
            invalid_status = (400, "Code expired or not found. Request a new code")
        elif challenge["attempts"] >= 5:
            invalid_status = (429, "Too many incorrect codes. Request a new code")
        else:
            import hmac
            if not hmac.compare_digest(challenge["code_hash"], otp_digest(phash, body.code)):
                await conn.execute(
                    "UPDATE donor_otp_challenges SET attempts = attempts + 1 WHERE phone_hash = $1",
                    phash,
                )
                invalid_status = (400, "Incorrect verification code")
            else:
                await conn.execute("DELETE FROM donor_otp_challenges WHERE phone_hash = $1", phash)
                donor_hash = donor_identity(phash)
                await conn.execute(
                    """INSERT INTO donor_profiles (donor_hash, display_name, opt_in_ledger)
                       VALUES ($1, '', false) ON CONFLICT (donor_hash) DO NOTHING""",
                    donor_hash,
                )
                session = await create_donor_session(conn, donor_hash, phash)
    if invalid_status:
        raise HTTPException(invalid_status[0], invalid_status[1])
    if session is None or donor_hash is None:
        raise HTTPException(400, "Could not verify donor session")
    return {**session, "donor_hash": donor_hash}



@router.get("/session")
async def current_donor_session(
    authorization: str | None = Header(None, alias="Authorization"),
    conn: asyncpg.Connection = Depends(get_conn),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Donor sign-in required")
    session = await verify_donor_token(conn, authorization[7:].strip())
    if session is None:
        raise HTTPException(401, "Invalid or expired donor session")
    return {"donor_hash": session["donor_hash"], "expires_at": session["expires_at"]}


@router.post("/logout")
async def logout_donor(
    authorization: str | None = Header(None, alias="Authorization"),
    conn: asyncpg.Connection = Depends(get_conn),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Donor sign-in required")
    session = await verify_donor_token(conn, authorization[7:].strip())
    if session is None:
        raise HTTPException(401, "Invalid or expired donor session")
    await revoke_donor_session(conn, session["session_id"])
    return {"ok": True}
