"""add first name to users

Revision ID: 9f2c1a7d4e6b
Revises: 36be61daa828
Create Date: 2026-09-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f2c1a7d4e6b"
down_revision: Union[str, None] = "36be61daa828"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(length=80), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "first_name")
