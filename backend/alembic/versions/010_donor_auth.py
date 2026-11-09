"""Add phone OTP challenges and revocable donor sessions.

Revision ID: 010_donor_auth
Revises: 009_sms_sessions
"""
from typing import Sequence, Union
from alembic import op

revision: str = "010_donor_auth"
down_revision: Union[str, None] = "009_sms_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE donor_otp_challenges (
            phone_hash TEXT PRIMARY KEY,
            code_hash TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            send_count INTEGER NOT NULL DEFAULT 1,
            window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            resend_after TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE TABLE donor_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            donor_hash TEXT NOT NULL REFERENCES donor_profiles(donor_hash) ON DELETE CASCADE,
            phone_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ
        )
    """)
    op.execute("CREATE INDEX idx_donor_sessions_hash ON donor_sessions(donor_hash)")
    op.execute("CREATE INDEX idx_donor_sessions_expiry ON donor_sessions(expires_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS donor_sessions")
    op.execute("DROP TABLE IF EXISTS donor_otp_challenges")
