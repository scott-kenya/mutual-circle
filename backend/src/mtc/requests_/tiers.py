"""Verification tier assignment — pure functions, testable in isolation.

R.U.T.H Section 4.8:
  - Tier 1: new token, low value → self-declared + rate limits + 5% audit
  - Tier 2: utility / school / hospital under KES 5,000 → object-level check
  - Tier 3: repeat or ≥ KES 5,000 → automated OCR of bill photo
  - Tier 4: assigned later by anomaly detection (not here)
"""
from typing import Literal

Category = Literal["utility", "school_fee", "hospital_invoice", "swap_bundle"]
Tier = int

TIER_3_THRESHOLD_PENCE = 500_000


def assign_tier(category: Category, amount_pence: int) -> Tier:
    if category == "swap_bundle":
        return 1
    if amount_pence >= TIER_3_THRESHOLD_PENCE:
        return 3
    return 2


def initial_status(tier: Tier) -> str:
    """Tier 2 requires photo evidence; Tier 3+ requires OCR; others auto-verify.

    R.U.T.H 4.3: object-level verification. External lookup is
    unconfirmed (section 8 item 2), so the fallback is a photo of the bill
    uploaded by the requester + automated plausibility checks in Console
    review. Tier 2 rows stay in pending_evidence until the photo arrives,
    then transition to pending_check for staff review.

    Tier 1 (swap bundles) and Tier 3+ behaviour unchanged.
    """
    if tier >= 3:
        return "pending_check"
    if tier == 2:
        return "pending_evidence"
    return "verified"