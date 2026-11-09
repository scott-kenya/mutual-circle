"""Africa's Talking SMS service — async, httpx-based."""
import logging
from typing import Any

import httpx

from mtc.config import settings

logger = logging.getLogger(__name__)

_SANDBOX_URL = "https://api.sandbox.africastalking.com/version1/messaging"
_PRODUCTION_URL = "https://api.africastalking.com/version1/messaging"


def _endpoint() -> str:
    env = settings.at_environment.lower()
    if env == "production":
        return _PRODUCTION_URL
    if env == "sandbox":
        return _SANDBOX_URL
    raise ValueError(f"AT_ENVIRONMENT must be 'sandbox' or 'production', got {env!r}")


def normalize_phone(phone: str) -> str:
    """Normalize Kenyan mobile numbers to +254XXXXXXXXX."""
    if not phone:
        raise ValueError("Phone number is required")
    p = "".join(ch for ch in phone.strip() if ch not in " -()")
    if p.startswith("+"):
        p = p[1:]
    if p.startswith("0"):
        p = "254" + p[1:]
    elif p.startswith("7") or p.startswith("1"):
        p = "254" + p
    if not (p.startswith("254") and len(p) == 12 and p.isdigit()):
        raise ValueError("Enter a valid Kenyan mobile number")
    return "+" + p


async def send_sms(*, phone: str, message: str) -> dict[str, Any]:
    """Send an SMS via Africa's Talking and return a normalized result."""
    if not settings.at_api_key or not settings.at_username:
        raise RuntimeError("Africa's Talking is not configured")
    normalized = normalize_phone(phone)
    data = {"username": settings.at_username, "to": normalized, "message": message}
    if settings.at_sender_id:
        data["from"] = settings.at_sender_id
    headers = {"apiKey": settings.at_api_key, "Accept": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(_endpoint(), data=data, headers=headers)
            response.raise_for_status()
            body = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.exception("Africa's Talking SMS transport failed")
        raise RuntimeError("SMS delivery service is unavailable") from exc

    recipients = (body.get("SMSMessageData") or {}).get("Recipients") or []
    recipient = recipients[0] if recipients else {}
    status_code = recipient.get("statusCode")
    ok = status_code == 101
    if not ok:
        logger.warning("AT SMS non-success: code=%r status=%r", status_code, recipient.get("status"))
    return {
        "ok": ok,
        "message_id": recipient.get("messageId"),
        "status": recipient.get("status"),
        "status_code": status_code,
        "cost": recipient.get("cost"),
        "provider_response": body,
        "error": None if ok else recipient.get("status") or "SMS was not accepted",
    }
