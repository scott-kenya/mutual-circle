"""Audit log — every privileged action appends here.

R.U.T.H Section 4.8: "every privileged action is logged."

The audit_log table is append-only by convention. The application never
issues UPDATE or DELETE against it. In production this would be enforced
by a separate role that has INSERT-only on this table.
"""
import json
import logging

import asyncpg

logger = logging.getLogger(__name__)


async def append_audit(
    conn: asyncpg.Connection,
    *,
    actor_role: str,
    actor_id: str | None,
    action: str,
    target_hash: str | None = None,
    metadata: dict | None = None,
) -> str:
    """Insert one audit row. Returns the new row id."""
    if actor_role not in ("enrolment", "fulfilment", "audit", "system"):
        raise ValueError(f"Invalid actor_role: {actor_role}")

    # Auto-resolve hash -> raw display value.
    # target_hash is stored as the HMAC hash (R.U.T.H 4.7 privacy).
    # But audit log viewers need to see the raw value the requester
    # typed to correlate against the photo evidence or bill.
    # If target_hash looks like a 64-char hex hash, look up
    # metadata.raw_object_id from the linked request and stash it
    # in the audit row's metadata JSONB under _target_display.
    meta = dict(metadata) if metadata else {}
    if target_hash and len(target_hash) == 64 and all(c in "0123456789abcdef" for c in target_hash):
        try:
            req_row = await conn.fetchrow(
                "SELECT metadata FROM requests WHERE hashed_object_id = $1 LIMIT 1",
                target_hash,
            )
            if req_row and req_row["metadata"]:
                req_meta = req_row["metadata"]
                if isinstance(req_meta, str):
                    req_meta = json.loads(req_meta)
                if isinstance(req_meta, dict):
                    raw = req_meta.get("raw_object_id")
                    if raw:
                        meta["_target_display"] = raw
        except Exception as exc:
            logger.warning("audit raw_object_id lookup failed: %s", exc)

    meta_json = json.dumps(meta) if meta else None
    row = await conn.fetchrow(
        """INSERT INTO audit_log (actor_role, actor_id, action, target_hash, metadata)
           VALUES ($1, $2, $3, $4, $5::jsonb)
           RETURNING id""",
        actor_role, actor_id, action, target_hash, meta_json,
    )
    logger.info("audit: %s %s — %s", actor_role, actor_id, action)
    return str(row["id"])


async def list_audit(conn: asyncpg.Connection, *, limit: int = 100) -> list[dict]:
    rows = await conn.fetch(
        """SELECT id, actor_role, actor_id, action, target_hash, metadata, created_at
           FROM audit_log
           ORDER BY created_at DESC
           LIMIT $1""",
        limit,
    )
    def _display(r) -> str | None:
        meta = r["metadata"]
        if isinstance(meta, str):
            try:
                meta = json.loads(meta)
            except Exception:
                return None
        if isinstance(meta, dict):
            return meta.get("_target_display")
        return None

    return [
        {
            "id": str(r["id"]),
            "actor_role": r["actor_role"],
            "actor_id": r["actor_id"],
            "action": r["action"],
            "target_hash": r["target_hash"],
            "target_display": _display(r),
            "metadata": r["metadata"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]