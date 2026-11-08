"""Pool request creation.

The Pool is object-level: the requester supplies a raw meter / admission /
invoice number under the legacy `hashed_object_id` field name, and the
server hashes it with a keyed HMAC (R.U.T.H 4.7) before storage. The
response echoes the raw value back so the requester can confirm what
they submitted; partners see only the stored hash when querying the
requests table.

Tier assignment depends on the amount and category — see
mtc.requests_.tiers.
"""
import hashlib
import hmac

import json
import asyncpg

from mtc.config import settings
from mtc.notifications.service import notify
from mtc.requests_.tiers import assign_tier, initial_status


def _hash_object_id(raw: str) -> str:
    """Keyed HMAC of a raw meter / admission / invoice number.

    R.U.T.H 4.7: object IDs can themselves identify a household or
    student. Use a keyed HMAC (not plain hash) so small input spaces
    can't be brute-forced. The key comes from LEDGER_HMAC_KEY.
    """
    if not settings.ledger_hmac_key or len(settings.ledger_hmac_key) < 32:
        raise RuntimeError(
            "LEDGER_HMAC_KEY must be set to 32+ characters per R.U.T.H 4.7. "
            "Add it to backend/.env and restart the server."
        )
    return hmac.new(
        settings.ledger_hmac_key.encode(),
        raw.encode(),
        hashlib.sha256,
    ).hexdigest()


async def create_pool(
    conn: asyncpg.Connection,
    *,
    token_hash: str,
    category: str,
    hashed_object_id: str,
    amount_pence: int,
    phone: str | None = None,
) -> dict:
    # Compute the keyed hash before storage (R.U.T.H 4.7). The param
    # name `hashed_object_id` is legacy — the client sends the raw
    # value under this field for wire compatibility.
    object_id_hash = _hash_object_id(hashed_object_id)

    tier = assign_tier(category, amount_pence)
    status = initial_status(tier)
    # R.U.T.H 4.7: the DB column `hashed_object_id` stores the keyed
    # HMAC hash (privacy). The raw value the requester typed is stored
    # in metadata.raw_object_id so they can still see what they submitted
    # in their own requests list (they cannot verify a 64-char hash
    # against a physical bill). Partners never read metadata — they
    # only see hashed_object_id, so the raw value stays requester-only.
    row = await conn.fetchrow(
        """
        INSERT INTO requests (token_hash, type, category, amount_pence, hashed_object_id, metadata, tier, status)
        VALUES ($1, 'pool', $2, $3, $4, $5::jsonb, $6, $7)
        RETURNING id, created_at, tier, status
        """,
        token_hash, category, amount_pence, object_id_hash,
        json.dumps({"raw_object_id": hashed_object_id}),
        tier, status,
    )
    pool_template = "pool_pending" if status == "pending_check" else "pool_submitted"
    await notify(
        conn, token_hash, str(row["id"]), pool_template,
        {"ref": hashed_object_id},
        phone=phone,
    )

    return {
        "id": str(row["id"]),
        "type": "pool",
        "category": category,
        "hashed_object_id": object_id_hash,   # the actual hash (DB value)
        "object_id_display": hashed_object_id, # the raw value (requester display)
        "amount_pence": amount_pence,
        "tier": row["tier"],
        "status": row["status"],
        "created_at": row["created_at"].isoformat(),
    }
