"""Requester outcome notifications — state-change → message pipeline.

Every request state change generates a notification row. The row is always
stored (in-app Messages tab). If a phone number is supplied by the caller
(SMS / USSD / WhatsApp initiators know it; web initiators do not — see
R.U.T.H §8 item 6), the notification is also delivered via SMS through
mtc.sms.service.send_sms.

If delivery fails, the notification row still exists in-app — SMS is
best-effort, never breaks the caller.

R.U.T.H Gap 1 fix: the requester always knows what happened to their request.
"""
import logging

import asyncpg

from mtc.sms.service import send_sms

logger = logging.getLogger(__name__)

TEMPLATES = {
    "swap_submitted":  "Mutual Circle: Bundle reserved at {location}. PIN: {pin}. Collect anytime.",
    "pool_submitted":  "Mutual Circle: Request received. Ref: {ref}. We will notify you when verified.",
    "pool_pending":    "Mutual Circle: Your bill requires extra verification. We will update you within 24 hours. Ref: {ref}.",
    "verified":        "Mutual Circle: Verified. Ref: {ref}. Payment queued.",
    "dispatched":      "Mutual Circle: Payment sent to the institution. Ref: {ref}. Confirmation within 2 hours.",
    "withdrawn":       "Mutual Circle: Request withdrawn. Ref: {ref}.",
    "collected":       "Mutual Circle: Bundle collected. Thank you.",
    "pool_collected":  "Mutual Circle: Your bill was paid at {partner}. Ref: {ref}. Thank you.",
    "pool_fulfilled":  "Mutual Circle: Payment confirmed by {partner}. Ref: {ref}. Thank you.",
}


async def notify(
    conn: asyncpg.Connection,
    token_hash: str,
    request_id: str | None,
    template_key: str,
    context: dict | None = None,
    *,
    phone: str | None = None,
) -> None:
    """Create a notification and, if a phone is provided, deliver via SMS.

    Best-effort — never breaks the caller. Notification row is always
    inserted (in-app delivery); SMS is attempted only if phone is given.
    """
    template = TEMPLATES.get(template_key)
    if template is None:
        logger.warning("Unknown notification template: %s", template_key)
        return
    try:
        content = template.format(**(context or {}))
    except (KeyError, IndexError) as exc:
        logger.warning("Notification template fill failed (%s): %s", template_key, exc)
        return

    # Step 1: always persist the in-app notification
    notification_id = None
    try:
        notification_id = await conn.fetchval(
            """INSERT INTO notifications (token_hash, request_id, template, content)
               VALUES ($1, $2, $3, $4)
               RETURNING id""",
            token_hash, request_id, template_key, content,
        )
    except Exception as exc:
        logger.error("Notification insert failed (%s): %s", template_key, exc)
        return

    # Step 2: attempt SMS delivery if we have a phone
    if not phone:
        return

    try:
        result = await send_sms(phone=phone, message=content)
        if result.get("ok"):
            await conn.execute(
                "UPDATE notifications SET status = 'sent', sent_at = now() WHERE id = $1",
                notification_id,
            )
            logger.info(
                "Notification %s sent via SMS (msg_id=%s)",
                notification_id, result.get("message_id"),
            )
        else:
            logger.warning(
                "SMS failed for notification %s: %s",
                notification_id, result.get("error") or result.get("status"),
            )
    except Exception as exc:
        logger.warning("SMS send raised for notification %s: %s", notification_id, exc)