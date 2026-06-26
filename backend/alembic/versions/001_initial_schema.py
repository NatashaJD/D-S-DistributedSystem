"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-23
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'customers',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255)),
        sa.Column('phone', sa.String(50)),
        sa.Column('region', sa.String(100), nullable=False),
        sa.Column('company', sa.String(255)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'departments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(50), unique=True, nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('head', sa.String(255)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'sla_configs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('stage_name', sa.String(50), unique=True, nullable=False),
        sa.Column('department', sa.String(50), nullable=False),
        sa.Column('sla_hours', sa.Float, nullable=False),
        sa.Column('business_start_hour', sa.Integer, default=8),
        sa.Column('business_end_hour', sa.Integer, default=17),
        sa.Column('business_days', sa.String(50), default='0,1,2,3,4'),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'service_requests',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('customer_id', UUID(as_uuid=True), sa.ForeignKey('customers.id'), nullable=False),
        sa.Column('product_category', sa.String(100), nullable=False),
        sa.Column('priority', sa.String(20), nullable=False, default='medium'),
        sa.Column('current_stage', sa.String(50), nullable=False, default='inquiry'),
        sa.Column('assigned_department', sa.String(50)),
        sa.Column('status', sa.String(30), nullable=False, default='in_progress'),
        sa.Column('description', sa.String(1000)),
        sa.Column('crm_reference', sa.String(100)),
        sa.Column('erp_reference', sa.String(100)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'events',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('request_id', UUID(as_uuid=True), sa.ForeignKey('service_requests.id'), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('stage', sa.String(50)),
        sa.Column('source_system', sa.String(50)),
        sa.Column('actor', sa.String(255)),
        sa.Column('description', sa.String(500)),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('metadata_json', JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        'journey_stages',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('request_id', UUID(as_uuid=True), sa.ForeignKey('service_requests.id'), nullable=False),
        sa.Column('stage_name', sa.String(50), nullable=False),
        sa.Column('department', sa.String(50), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('sla_deadline', sa.DateTime(timezone=True)),
        sa.Column('status', sa.String(20), nullable=False, default='in_progress'),
        sa.Column('sla_percentage', sa.Float, default=0.0),
        sa.Column('assigned_to', sa.String(255)),
    )

    # Indexes for performance
    op.create_index('ix_service_requests_status', 'service_requests', ['status'])
    op.create_index('ix_service_requests_department', 'service_requests', ['assigned_department'])
    op.create_index('ix_journey_stages_request_id', 'journey_stages', ['request_id'])
    op.create_index('ix_events_request_id', 'events', ['request_id'])
    op.create_index('ix_events_timestamp', 'events', ['timestamp'])


def downgrade() -> None:
    op.drop_table('journey_stages')
    op.drop_table('events')
    op.drop_table('service_requests')
    op.drop_table('sla_configs')
    op.drop_table('departments')
    op.drop_table('customers')
