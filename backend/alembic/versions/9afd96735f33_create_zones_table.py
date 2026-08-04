"""create zones table

Revision ID: 9afd96735f33
Revises: 08b4c9d64b6a
Create Date: 2026-08-04 07:56:47.272326

"""
import geoalchemy2
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9afd96735f33'
down_revision: Union[str, Sequence[str], None] = '08b4c9d64b6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():

    op.create_table(
        'zones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('zone_name', sa.String(), nullable=False),
        sa.Column(
            'geometry',
            geoalchemy2.Geometry(
                geometry_type='POLYGON',
                srid=4326
            ),
            nullable=False
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('zone_name')
    )

    op.create_index(
        op.f('ix_zones_id'),
        'zones',
        ['id'],
        unique=False
    )


def downgrade():

    op.drop_index(op.f('ix_zones_id'), table_name='zones')

    op.drop_table('zones')