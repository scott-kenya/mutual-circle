# Mutual Circle API Â— Developer Reference

Complete reference for building against the Mutual Circle backend.

## Base URL

- Local dev: http://127.0.0.1:8000
- Interactive docs: /docs (Swagger UI) and /redoc
- OpenAPI schema: /openapi.json
- API version: 0.6.0

## Quickstart

Step 1 - Issue a requester token from a phone number:

    curl -X POST http://127.0.0.1:8000/tokens -H "Content-Type: application/json" -d "{\"phone\":\"+254712345678\"}"

Returns: {"token":"a1b2c3d4e5f6a7b8"}

Step 2 - Reserve a food bundle:

    curl -X POST http://127.0.0.1:8000/requests/swap -H "Content-Type: application/json" -H "X-Token: a1b2c3d4e5f6a7b8" -d "{\"bundle_category\":\"family\",\"locker_location\":\"Kibera Hub A\"}"

Step 3 - View your requests:

    curl http://127.0.0.1:8000/requests/mine -H "X-Token: a1b2c3d4e5f6a7b8"

## Error responses

Every failure returns the same JSON envelope:

    {"ok": false, "reason": "human-readable message", "status": 401}

HTTP status codes preserved. Business failures return HTTP 200 with ok: false.

## Authentication

Four schemes, one per actor type.

Requester - X-Token header (16-char hex, issued by POST /tokens)
Donor - X-Donor-Hash header (client-generated persistent hash)
Staff - Authorization: Bearer <jwt> (issued by POST /staff/login)
Partner - X-Partner-Key header (static, per-partner, e.g. kplc-demo-key-2026)

## Endpoints by actor

Requester (X-Token): POST /tokens, POST /requests/swap, POST /requests/pool, GET /requests/mine, POST /requests/{id}/pay, POST /requests/pool/{id}/evidence, GET /requests/pool/{id}/evidence, POST /requests/{id}/collect, GET /notifications/mine, PATCH /notifications/{id}/read, PATCH /notifications/read-all

Donor (X-Donor-Hash): POST /donations, GET /donations/mine, GET /donations/leaderboard, POST /pledges, GET /pledges/mine

Staff (Bearer): POST /staff/login, GET /fulfilment/queue, POST /fulfilment/requests/{id}/dispatch, POST /fulfilment/requests/{id}/voucher, GET /audit/flags, POST /audit/ocr/{id}/complete, GET /audit/evidence-queue, POST /audit/evidence/{id}/approve, POST /audit/evidence/{id}/reject

Partner (X-Partner-Key): GET /partners/me, GET /partners/me/redemptions, POST /partners/me/confirm/{id}, POST /partner/redeem

## Request status lifecycle

Swap path: reserved -> dispatched (optional) -> collected
Pool path (Tier 2): pending_evidence -> pending_check -> verified -> submitted_to_partner -> fulfilled
Pool path (Tier 3): pending_check -> verified -> submitted_to_partner -> fulfilled
           or verified -> voucher_issued -> collected

Terminal: collected, fulfilled, withdrawn, rejected.

## Money

All amounts in pence (amount_pence, max_value_pence, total_pooled_pence). KES 5,000 = 500000 pence.

## Reference

- docs/auth.md - full auth reference
- docs/roles.md - six-actor permission matrix
- docs/tiers.md - tier assignment rules
- docs/payout.md - dispatch vs voucher decision
- /docs (Swagger UI) - interactive endpoint explorer
- /openapi.json - machine-readable schema
## Payment and evidence endpoints (added 2026-11)

M-PESA:
- POST /requests/{id}/pay, POST /donations/{id}/pay, POST /pledges/{id}/pay — trigger STK Push. Body `{\"phone\": \"+2547XXXXXXXX\"}`.
- POST /mpesa/stk/callback — Safaricom posts here. Four-layer verification (txn ID, amount, phone, receipt format). Failures mark `status='callback_rejected'`.

Tier 2 photo evidence:
- POST /requests/pool/{id}/evidence — multipart `file`. jpeg/png/pdf, max 5 MB.
- GET /requests/pool/{id}/evidence — token-authenticated serve.
- GET /audit/evidence-queue — audit role.
- POST /audit/evidence/{id}/approve — pending_check -> verified.
- POST /audit/evidence/{id}/reject — body `{\"reason\": \"...\"}`. -> rejected.

object_id_display:
`GET /requests/mine` and `POST /requests/pool` return `hashed_object_id` (64-char hash, used by partners) AND `object_id_display` (raw value requester typed, for requester and audit display only).
