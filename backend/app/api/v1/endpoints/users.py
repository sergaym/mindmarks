
from app.api.v1.deps import get_current_active_superuser, get_current_user
from app.api.v1.schemas.user import UserRead, UserUpdate
from app.api.v1.services import user_service
from app.core.security import get_password_hash
from app.db.base import DBSession
from app.db.models import User

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Get current user
    """
    # Convert User model to UserRead schema
    return UserRead.from_orm(current_user)
