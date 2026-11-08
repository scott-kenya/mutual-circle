"""Audit role endpoints — OCR, flags, log, CSV export."""
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from pathlib import Path

from pydantic import BaseModel, Field

import asyncpg

from mtc.admin.export import export_audit_csv
from mtc.admin.flags import FlagConflict, clear_false_positive, list_flags, route_to_tier4
from mtc.admin.ocr import OcrConflict, complete_ocr, list_ocr_queue
from mtc.admin.evidence import EvidenceConflict, list_evidence_queue, approve_evidence, reject_evidence
from mtc.audit.log import list_audit
from mtc.auth.deps import require_role
from mtc.config import settings
from mtc.db.main import get_conn

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_EVIDENCE_DIR = _BACKEND_ROOT / settings.evidence_storage_dir

router = APIRouter(prefix="/audit", tags=["audit"])
require_audit = require_role("audit")


@router.get("/ocr-queue")
async def ocr_queue(
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    return {"requests": await list_ocr_queue(conn)}


@router.post("/ocr/{request_id}/complete")
async def complete_ocr_route(
    request_id: str,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await complete_ocr(conn, request_id=request_id, staff_id=session["staff_id"])
    except LookupError:
        raise HTTPException(404, "Request not found")
    except OcrConflict as e:
        raise HTTPException(409, detail=e.reason)


@router.get("/flags")
async def flags(
    status: str | None = None,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    return {"flags": await list_flags(conn, status=status)}


@router.post("/flags/{flag_id}/route-tier4")
async def route_flag(
    flag_id: str,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await route_to_tier4(conn, flag_id=flag_id, staff_id=session["staff_id"])
    except LookupError:
        raise HTTPException(404, "Flag not found")
    except FlagConflict as e:
        raise HTTPException(409, detail=e.reason)


class ClearFlagBody(BaseModel):
    note: str = Field(..., min_length=1, max_length=500)


@router.post("/flags/{flag_id}/clear")
async def clear_flag(
    flag_id: str,
    body: ClearFlagBody,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await clear_false_positive(
            conn, flag_id=flag_id, staff_id=session["staff_id"], note=body.note,
        )
    except LookupError:
        raise HTTPException(404, "Flag not found")
    except FlagConflict as e:
        raise HTTPException(409, detail=e.reason)


@router.get("/log")
async def log(
    limit: int = 100,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    return {"entries": await list_audit(conn, limit=limit)}


@router.get("/export.csv")
async def export_csv(
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    csv_text = await export_audit_csv(conn, staff_id=session["staff_id"])
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="mutual-circle-audit-log.csv"'},
    )

# ═══════════════════════════════════════════════════════════════════════════
# Tier 2 photo evidence review (R.U.T.H 4.3 fallback path)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/evidence-queue")
async def evidence_queue_route(
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    return {"requests": await list_evidence_queue(conn)}


@router.get("/evidence/{request_id}/photo")
async def evidence_photo_route(
    request_id: str,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    row = await conn.fetchrow(
        "SELECT evidence_photo_path FROM requests WHERE id = $1",
        request_id,
    )
    if row is None:
        raise HTTPException(404, "Request not found")
    if not row["evidence_photo_path"]:
        raise HTTPException(404, "No evidence photo for this request")
    full_path = _EVIDENCE_DIR / row["evidence_photo_path"]
    if not full_path.exists():
        raise HTTPException(404, "Evidence file missing on disk")
    return FileResponse(full_path)


@router.post("/evidence/{request_id}/approve")
async def evidence_approve_route(
    request_id: str,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await approve_evidence(
            conn, request_id=request_id, staff_id=session["staff_id"],
        )
    except LookupError:
        raise HTTPException(404, "Request not found")
    except EvidenceConflict as e:
        raise HTTPException(409, detail=e.reason)


class RejectEvidenceBody(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)


@router.post("/evidence/{request_id}/reject")
async def evidence_reject_route(
    request_id: str,
    body: RejectEvidenceBody,
    session: dict = Depends(require_audit),
    conn: asyncpg.Connection = Depends(get_conn),
):
    try:
        return await reject_evidence(
            conn, request_id=request_id, staff_id=session["staff_id"],
            reason=body.reason,
        )
    except LookupError:
        raise HTTPException(404, "Request not found")
    except EvidenceConflict as e:
        raise HTTPException(409, detail=e.reason)
