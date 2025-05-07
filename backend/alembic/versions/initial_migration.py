"""Initial migration

Revision ID: initial_migration
Revises: 
Create Date: 2025-05-07

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'initial_migration'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('TRUE')),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('users_email_idx', 'users', ['email'], unique=True)
    
    # Create notes table
    op.create_table(
        'notes',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('source_url', sa.String(length=512), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('tags', sa.String(length=255), nullable=True),
        sa.Column('is_summarized', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('notes_user_id_idx', 'notes', ['user_id'], unique=False)
    
    # Create reading_progress table
    op.create_table(
        'reading_progress',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('note_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('current_position', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('total_length', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('progress_percentage', sa.Float(), nullable=False, server_default=sa.text('0')),
        sa.Column('last_read_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['note_id'], ['notes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('note_id', 'user_id', name='unique_user_note_progress')
    )
    op.create_index('reading_progress_note_id_idx', 'reading_progress', ['note_id'], unique=False)
    op.create_index('reading_progress_user_id_idx', 'reading_progress', ['user_id'], unique=False)


def downgrade():
    op.drop_table('reading_progress')
    op.drop_table('notes')
    op.drop_table('users') 