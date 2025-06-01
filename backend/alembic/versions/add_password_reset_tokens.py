"""Add password reset tokens table

Revision ID: add_password_reset_tokens
Revises: 0a9256bed72c
Create Date: 2024-01-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_password_reset_tokens'
down_revision = '0a9256bed72c'
branch_labels = None
depends_on = None


def upgrade():
    """Add password reset tokens table"""
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_email', sa.String(), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for better performance
    op.create_index('password_reset_tokens_user_email_idx', 'password_reset_tokens', ['user_email'], unique=False)
    op.create_index('password_reset_tokens_expires_at_idx', 'password_reset_tokens', ['expires_at'], unique=False)


def downgrade():
    """Remove password reset tokens table"""
    op.drop_index('password_reset_tokens_expires_at_idx', table_name='password_reset_tokens')
    op.drop_index('password_reset_tokens_user_email_idx', table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens') 