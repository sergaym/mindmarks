"""Fix content status enum: change 'in-progress' to 'in_progress'

Revision ID: 6f8e9d2a1b3c
Revises: 45kd34m9masmo234d
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '6f8e9d2a1b3c'
down_revision = '45kd34m9masmo234d'
branch_labels = None
depends_on = None


def upgrade():
    """
    Fix the content status enum to change 'in-progress' to 'in_progress'
    """
    
    # Step 1: Remove the existing default constraint
    op.execute("ALTER TABLE content ALTER COLUMN status DROP DEFAULT;")
    
    # Step 2: Create a new enum type with the correct values
    op.execute("""
        CREATE TYPE contentstatusenum_new AS ENUM (
            'planned', 'in_progress', 'completed', 'archived'
        );
    """)
    
    # Step 3: Convert the column to use the new enum type with proper value mapping
    op.execute("""
        ALTER TABLE content 
        ALTER COLUMN status TYPE contentstatusenum_new 
        USING CASE 
            WHEN status::text = 'in-progress' THEN 'in_progress'::contentstatusenum_new
            ELSE status::text::contentstatusenum_new
        END;
    """)
    
    # Step 4: Drop the old enum and rename the new one
    op.execute("DROP TYPE contentstatusenum CASCADE;")
    op.execute("ALTER TYPE contentstatusenum_new RENAME TO contentstatusenum;")
    
    # Step 5: Add back the default constraint with the new enum type
    op.execute("""
        ALTER TABLE content 
        ALTER COLUMN status SET DEFAULT 'planned'::contentstatusenum;
    """)


def downgrade():
    """
    Revert back to 'in-progress' with hyphen
    """
    
    # Step 1: Remove the existing default constraint
    op.execute("ALTER TABLE content ALTER COLUMN status DROP DEFAULT;")
    
    # Step 2: Create the old enum type with 'in-progress'
    op.execute("""
        CREATE TYPE contentstatusenum_old AS ENUM (
            'planned', 'in-progress', 'completed', 'archived'
        );
    """)
    
    # Step 3: Convert the column back to use the old enum type
    op.execute("""
        ALTER TABLE content 
        ALTER COLUMN status TYPE contentstatusenum_old 
        USING CASE 
            WHEN status::text = 'in_progress' THEN 'in-progress'::contentstatusenum_old
            ELSE status::text::contentstatusenum_old
        END;
    """)
    
    # Step 4: Drop the new enum and rename the old one back
    op.execute("DROP TYPE contentstatusenum CASCADE;")
    op.execute("ALTER TYPE contentstatusenum_old RENAME TO contentstatusenum;")
    
    # Step 5: Add back the default constraint
    op.execute("""
        ALTER TABLE content 
        ALTER COLUMN status SET DEFAULT 'planned'::contentstatusenum;
    """) 