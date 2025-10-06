"""
Database configuration and models
"""

from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.sql import func
from decouple import config
import asyncio

# Database URL - Use direct connection (port 5432) to bypass pooling conflicts
DATABASE_URL = config("DATABASE_URL", default="sqlite:///./budget_buddy.db")

# If using Supabase, force direct connection to avoid SASL auth conflicts
if "supabase" in DATABASE_URL:
    # Replace transaction pooler port 6543 with direct connection port 5432
    DATABASE_URL = DATABASE_URL.replace(":6543/", ":5432/")

# Create engine with optimized pooling for Render free tier
if "postgresql" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_size=2,          # Minimal pool for free tier memory limits
        max_overflow=3,       # Very limited overflow 
        pool_timeout=20,      # Shorter timeout
        pool_recycle=1800,    # Recycle connections every 30 min
        pool_pre_ping=True,   # Verify connections before use
        pool_reset_on_return='commit'  # Reset connections efficiently
    )
else:
    # SQLite configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# User model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    tier = Column(String(50), default="Starter")
    total_savings = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

# Refresh token model
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_revoked = Column(Boolean, default=False)

# Password reset token model
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_used = Column(Boolean, default=False)

# User preferences model (for tier-based features)
class UserPreference(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    preference_type = Column(String(50), nullable=False)  # theme, feature, etc.
    preference_key = Column(String(100), nullable=False)
    preference_value = Column(Text)
    is_active = Column(Boolean, default=False)
    unlocked_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# API usage tracking (for rate limiting premium features)
class APIUsage(Base):
    __tablename__ = "api_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    endpoint = Column(String(100), nullable=False)
    usage_count = Column(Integer, default=1)
    date = Column(DateTime(timezone=True), server_default=func.now())
    tier_at_usage = Column(String(50))

# Database initialization
async def init_db():
    """Initialize database and create tables asynchronously"""
    import asyncio
    import threading
    
    def _sync_init_db():
        """Synchronous database initialization to run in thread"""
        try:
            # Test database connection first
            from sqlalchemy import text
            test_session = SessionLocal()
            test_session.execute(text("SELECT 1"))
            test_session.close()
            print("✅ Database connection successful")
            
            # Create all tables
            Base.metadata.create_all(bind=engine)
            print("✅ Database tables created successfully")
            return True
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            print(f"DATABASE_URL: {DATABASE_URL}")
            raise
    
    try:
        # Run blocking database operations in thread pool to avoid blocking event loop
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _sync_init_db)
    except Exception as e:
        print(f"❌ Async database initialization failed: {e}")
        raise

# Dependency to get database session
def get_db_session():
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# User CRUD operations
class UserCRUD:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_email(self, email: str):
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: int):
        return self.db.query(User).filter(User.id == user_id).first()
    
    def create_user(self, email: str, full_name: str, hashed_password: str):
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update_user_login(self, user_id: int):
        user = self.get_user_by_id(user_id)
        if user:
            user.last_login = func.now()
            self.db.commit()
        return user
    
    def update_user_tier(self, user_id: int, tier: str, total_savings: float):
        user = self.get_user_by_id(user_id)
        if user:
            user.tier = tier
            user.total_savings = total_savings
            self.db.commit()
        return user
    
    def update_user_password(self, user_id: int, hashed_password: str):
        user = self.get_user_by_id(user_id)
        if user:
            user.hashed_password = hashed_password
            self.db.commit()
        return user

# Refresh token CRUD operations
class RefreshTokenCRUD:
    def __init__(self, db: Session):
        self.db = db
    
    def create_refresh_token(self, user_id: int, token: str, expires_at):
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        self.db.add(refresh_token)
        self.db.commit()
        return refresh_token
    
    def get_refresh_token(self, token: str):
        return self.db.query(RefreshToken).filter(
            RefreshToken.token == token,
            RefreshToken.is_revoked == False
        ).first()
    
    def revoke_refresh_token(self, token: str):
        refresh_token = self.get_refresh_token(token)
        if refresh_token:
            refresh_token.is_revoked = True
            self.db.commit()
        return refresh_token
    
    def revoke_all_user_tokens(self, user_id: int):
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).update({"is_revoked": True})
        self.db.commit()

# Password reset token CRUD operations
class PasswordResetTokenCRUD:
    def __init__(self, db: Session):
        self.db = db
    
    def create_reset_token(self, user_id: int, token: str, expires_at):
        # Invalidate any existing reset tokens for this user
        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user_id,
            PasswordResetToken.is_used == False
        ).update({"is_used": True})
        
        reset_token = PasswordResetToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        self.db.add(reset_token)
        self.db.commit()
        return reset_token
    
    def get_reset_token(self, token: str):
        from datetime import datetime
        return self.db.query(PasswordResetToken).filter(
            PasswordResetToken.token == token,
            PasswordResetToken.is_used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        ).first()
    
    def use_reset_token(self, token: str):
        reset_token = self.get_reset_token(token)
        if reset_token:
            reset_token.is_used = True
            self.db.commit()
        return reset_token