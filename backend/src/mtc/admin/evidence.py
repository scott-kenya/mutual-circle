"""Tier 2 photo evidence — staff review queue.

R.U.T.H §4.3: object-level verification before funds move. External
lookup is unconfirmed (§8 item 2), so the fallback is a submitted
bill photo reviewed by staff. This module is the "staff review"
half of that loop; the "requester upload" half is in
mtc/routes/requester.py.

Flow:
  requester uploads photo -> status='pending_check'
    ↓ (this module)
  staff reviews + approves -> status='verified'  → notify requester
  staff reviews + rejects  -> status='rejected'  → notify requester

Only Tier 2 requests (>= KES 500 and < KES 5000) hit this queue.
Tier 1 auto-verifies; Tier 3 uses the OCR flow in admin/ocr.py.
"""
import asyncpg

from mtc.audit.log import append_audit
from mtc.notifications.service import notify


class EvidenceConflict(Exception):
    """Raised when a request is not in a state that can be approved/rejected."""
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


async def list_evidence_queue(conn: asyncpg.Connection) -> list[dict]:
    """Return all Tier 2 requests awaiting photo review."""
    rows = await conn.fetch(
        """
        SELECT id, category, amount_pence, hashed_object_id,
               tier, status, evidence_submitted_at, created_at
        FROM requests
        WHERE type = 'pool'
          AND tier = 2
          AND status = 'pending_check'
          AND evidence_photo_path IS NOT NULL
        ORDER BY evidence_submitted_at ASC NULLS LAST
        """
    )
    return [
        {
            "id": str(r["id"]),
            "category": r["category"],
            "amount_pence": r["amount_pence"],
            "hashed_object_id": r["hashed_object_id"],
            "tier": r["tier"],
            "status": r["status"],
            "evidence_submitted_at": (
                r["evidence_submitted_at"].isoformat()
                if r["evidence_submitted_at"] else None
            ),
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


async def approve_evidence(
    conn: asyncpg.Connection,
    *,
    request_id: str,
    staff_id: str,
) -> dict:
    """Approve photo evidence: status pending_check -> verified."""
    async with conn.transaction():
        req = await conn.fetchrow(
            "SELECT * FROM requests WHERE id = $1 FOR UPDATE",
            request_id,
        )
        if req is None:
            raise LookupError(f"Request not found: {request_id}")
        if req["type"] != "pool":
            raise EvidenceConflict("Only pool requests use photo evidence")
        if req["tier"] != 2:
            raise EvidenceConflict(
                f"Only Tier 2 requests use photo evidence (got tier {req['tier']})"
            )
        if req["status"] != "pending_check":
            raise EvidenceConflict(
                f"Cannot approve in status '{req['status']}'"
            )
        if not req["evidence_photo_path"]:
            raise EvidenceConflict("No photo evidence attached")

        await conn.execute(
            "UPDATE requests SET status = 'verified', updated_at = now() WHERE id = $1",
            request_id,
        )
        await append_audit(
            conn, actor_role="audit", actor_id=staff_id,
            action=f"Approved photo evidence for {request_id}",
            target_hash=req["hashed_object_id"],
            metadata={
                "amount_pence": req["amount_pence"],
                "tier": req["tier"],
                "evidence_photo_path": req["evidence_photo_path"],
            },
        )

    await notify(
        conn, req["token_hash"], request_id, "verified",
        {"ref": req["hashed_object_id"]},
    )

    return {"request_id": request_id, "status": "verified"}


async def reject_evidence(
    conn: asyncpg.Connection,
    *,
    request_id: str,
    staff_id: str,
    reason: str,
) -> dict:
    """Reject photo evidence: status pending_check -> rejected."""
    if not reason or len(reason.strip()) < 3:
        raise EvidenceConflict("Rejection reason required (min 3 chars)")
    reason = reason.strip()[:500]

    async with conn.transaction():
        req = await conn.fetchrow(
            "SELECT * FROM requests WHERE id = $1 FOR UPDATE",
            request_id,
        )
        if req is None:
            raise LookupError(f"Request not found: {request_id}")
        if req["type"] != "pool":
            raise EvidenceConflict("Only pool requests use photo evidence")
        if req["tier"] != 2:
            raise EvidenceConflict(
                f"Only Tier 2 requests use photo evidence (got tier {req['tier']})"
            )
        if req["status"] != "pending_check":
            raise EvidenceConflict(
                f"Cannot reject in status '{req['status']}'"
            )

        await conn.execute(
            "UPDATE requests SET status = 'rejected', updated_at = now() WHERE id = $1",
            request_id,
        )
        await append_audit(
            conn, actor_role="audit", actor_id=staff_id,
            action=f"Rejected photo evidence for {request_id}: {reason}",
            target_hash=req["hashed_object_id"],
            metadata={
                "amount_pence": req["amount_pence"],
                "tier": req["tier"],
                "reason": reason,
            },
        )

    await notify(
        conn, req["token_hash"], request_id, "evidence_rejected",
        {"ref": req["hashed_object_id"], "reason": reason},
    )

    return {"request_id": request_id, "status": "rejected", "reason": reason}
