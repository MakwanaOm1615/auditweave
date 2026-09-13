from sqlalchemy import func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from ..auth import get_password_hash, verify_password
from ..models import AuditLog, User


class EmailAlreadyRegisteredError(Exception):
    pass


class AuthDatabaseError(Exception):
    pass


def create_user(db: Session, email: str, password: str, first_name: str) -> User:
    try:
        existing = db.query(User).filter(func.lower(User.email) == email).first()
        if existing:
            raise EmailAlreadyRegisteredError

        user = User(
            email=email,
            first_name=first_name,
            password_hash=get_password_hash(password),
            role="user",
        )
        db.add(user)
        db.flush()
        db.add(AuditLog(action=f"User registration: {user.email}", user_id=user.id))
        db.commit()
        db.refresh(user)
        return user
    except EmailAlreadyRegisteredError:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyRegisteredError from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise AuthDatabaseError from exc


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    try:
        user = db.query(User).filter(func.lower(User.email) == email).first()
        if not user or not verify_password(password, user.password_hash):
            return None

        db.add(AuditLog(action=f"User login: {user.email}", user_id=user.id))
        db.commit()
        return user
    except SQLAlchemyError as exc:
        db.rollback()
        raise AuthDatabaseError from exc
