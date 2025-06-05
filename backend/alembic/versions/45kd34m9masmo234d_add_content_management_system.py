"""Add content management system and remove unused note models

Revision ID: add_content_management_system
Revises: add_password_reset_tokens
Create Date: 2025-06-05 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '45kd34m9masmo234d'
down_revision = 'add_password_reset_tokens'
branch_labels = None
depends_on = None


def upgrade():
    # Remove unused tables
    op.drop_index('reading_progress_note_id_idx', table_name='reading_progress')
    op.drop_index('reading_progress_user_id_idx', table_name='reading_progress')
    op.drop_table('reading_progress')
    
    op.drop_index('notes_user_id_idx', table_name='notes')
    op.drop_table('notes')
    
    # Create content types enum (if they don't exist)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE contenttypeenum AS ENUM ('book', 'article', 'video', 'podcast', 'course', 'other');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE contentstatusenum AS ENUM ('planned', 'in-progress', 'completed', 'archived');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE contentpriorityenum AS ENUM ('low', 'medium', 'high');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Define the enums for table creation
    content_type_enum = postgresql.ENUM('book', 'article', 'video', 'podcast', 'course', 'other', name='contenttypeenum', create_type=False)
    content_status_enum = postgresql.ENUM('planned', 'in-progress', 'completed', 'archived', name='contentstatusenum', create_type=False)
    content_priority_enum = postgresql.ENUM('low', 'medium', 'high', name='contentpriorityenum', create_type=False)
    
    # Create content table
    op.create_table(
        'content',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('type', content_type_enum, nullable=False),
        sa.Column('url', sa.String(length=1024), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('status', content_status_enum, nullable=False, server_default=sa.text("'planned'::contentstatusenum")),
        sa.Column('priority', content_priority_enum, nullable=False, server_default=sa.text("'medium'::contentpriorityenum")),
        sa.Column('content', postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('key_takeaways', postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('author', sa.String(length=255), nullable=True),
        sa.Column('published_date', sa.DateTime(), nullable=True),
        sa.Column('estimated_read_time', sa.Integer(), nullable=True),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('progress', sa.Float(), nullable=False, server_default=sa.text('0.0')),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('created_by_id', sa.String(), nullable=False),
        sa.Column('last_edited_by_id', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['last_edited_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for content table
    op.create_index('content_created_by_id_idx', 'content', ['created_by_id'], unique=False)
    op.create_index('content_type_idx', 'content', ['type'], unique=False)
    op.create_index('content_status_idx', 'content', ['status'], unique=False)
    op.create_index('content_priority_idx', 'content', ['priority'], unique=False)
    op.create_index('content_created_at_idx', 'content', ['created_at'], unique=False)
    op.create_index('content_tags_gin_idx', 'content', ['tags'], unique=False, postgresql_using='gin')
    
    # Create content_collaborators table
    op.create_table(
        'content_collaborators',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('content_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('permission', sa.String(length=50), nullable=False, server_default=sa.text("'read'")),
        sa.Column('invited_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['content_id'], ['content.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('content_id', 'user_id', name='unique_content_collaborator')
    )
    
    # Create indexes for content_collaborators table
    op.create_index('content_collaborators_content_id_idx', 'content_collaborators', ['content_id'], unique=False)
    op.create_index('content_collaborators_user_id_idx', 'content_collaborators', ['user_id'], unique=False)


def downgrade():
    # Drop content management tables
    op.drop_index('content_collaborators_user_id_idx', table_name='content_collaborators')
    op.drop_index('content_collaborators_content_id_idx', table_name='content_collaborators')
    op.drop_table('content_collaborators')
    
    op.drop_index('content_tags_gin_idx', table_name='content')
    op.drop_index('content_created_at_idx', table_name='content')
    op.drop_index('content_priority_idx', table_name='content')
    op.drop_index('content_status_idx', table_name='content')
    op.drop_index('content_type_idx', table_name='content')
    op.drop_index('content_created_by_id_idx', table_name='content')
    op.drop_table('content')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS contentpriorityenum")
    op.execute("DROP TYPE IF EXISTS contentstatusenum")
    op.execute("DROP TYPE IF EXISTS contenttypeenum")
    
    # Recreate notes table
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
    
    # Recreate reading_progress table
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