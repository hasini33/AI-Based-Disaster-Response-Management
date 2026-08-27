"""add event_date to disasters

Revision ID: 9868725478c4
Revises: 21ddb3722508
Create Date: 2026-08-24 17:40:06.825119
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9868725478c4"
down_revision: Union[str, Sequence[str], None] = "21ddb3722508"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add event_date column to disasters table."""

    op.add_column(
        "disasters",
        sa.Column(
            "event_date",
            sa.DateTime(),
            nullable=True
        )
    )


def downgrade() -> None:
    """Remove event_date column from disasters table."""

    op.drop_column(
        "disasters",
        "event_date"
    )