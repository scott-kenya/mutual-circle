"""Unit tests for donor phone normalization and opaque identity derivation."""
import pytest

from mtc.auth.donor import donor_identity, otp_digest, phone_digest
from mtc.config import settings
from mtc.sms.service import normalize_phone, _normalize_phone


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("0712 345 678", "+254712345678"),
        ("+254 712 345 678", "+254712345678"),
        ("254712345678", "+254712345678"),
        ("0112-345-678", "+254112345678"),
        ("+254112345678", "+254112345678"),
        ("0712-345-678", "+254712345678"),
    ],
)
def test_normalize_kenyan_phone(raw, expected):
    assert normalize_phone(raw) == expected


@pytest.mark.parametrize("raw", ["", "12345", "+1 415 555 2671", "25471234567", "2547123456789"])
def test_reject_invalid_phone(raw):
    with pytest.raises(ValueError):
        normalize_phone(raw)


def test_legacy_sms_normalizer_alias():
    assert _normalize_phone("0712345678") == "+254712345678"


def test_donor_identity_is_stable_and_not_phone_number(monkeypatch):
    monkeypatch.setattr(settings, "token_hmac_key_current", "t" * 40)
    monkeypatch.setattr(settings, "ledger_hmac_key", "l" * 40)
    phone_hash = phone_digest("+254712345678")
    identity = donor_identity(phone_hash)
    assert phone_hash == phone_digest("+254712345678")
    assert identity == donor_identity(phone_hash)
    assert identity != phone_hash
    assert "+254712345678" not in identity


def test_otp_digest_is_bound_to_phone_and_code(monkeypatch):
    monkeypatch.setattr(settings, "jwt_secret", "j" * 40)
    assert otp_digest("phone-a", "123456") == otp_digest("phone-a", "123456")
    assert otp_digest("phone-a", "123456") != otp_digest("phone-b", "123456")
    assert otp_digest("phone-a", "123456") != otp_digest("phone-a", "654321")


async def test_donor_routes_reject_forged_legacy_header():
    from unittest.mock import AsyncMock
    from httpx import ASGITransport, AsyncClient
    from mtc.db.main import get_conn
    from mtc.main import app

    conn = AsyncMock()
    app.dependency_overrides[get_conn] = lambda: conn
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"X-Donor-Hash": "victim-donor-hash"}
            donation = await client.post("/donations", headers=headers, json={
                "amount_pence": 1000, "is_anonymous": True, "opt_in_ledger": False
            })
            pledge = await client.post("/pledges", headers=headers, json={
                "type": "goods", "description": "Food", "locality": "Nairobi"
            })
        assert donation.status_code == 401
        assert pledge.status_code == 401
        conn.fetchrow.assert_not_awaited()
    finally:
        app.dependency_overrides.clear()
