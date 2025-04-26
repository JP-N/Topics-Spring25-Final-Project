import os
from datetime import datetime, timedelta
from typing import Optional
import logging
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from mumundo.api.models.user import User
# Logging
logger = logging.getLogger(__name__)

# Router
router = APIRouter(prefix="/api/auth", tags=["auth"])

# JWT settings and password hashing
SECRET_KEY = "2a33c01bffbd1620f710c408f0a630f839e449b4c3356a15866347f9416bdef5"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Models/Classes
class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_email(email: str):
    return await User.find_one(User.email == email)

async def authenticate_user(email: str, password: str):
    user = await get_user_by_email(email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info("Decoding access token")
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except:
        raise credentials_exception
        logger.warning("Invalid token received during authentication")

    logger.info(f"Token valid for user: {token_data.email}")
    user = await get_user_by_email(token_data.email)
    
    if user is None:
        raise credentials_exception

    return user


# Route for creating a new user
@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):

    # Check if user already exists, if not create new entry
    existing_user = await get_user_by_email(user_data.email)
    logger.info(f"Attempting to register user with email: {user_data.email}")
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )


    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password
    )

    await new_user.insert()
    logger.info(f"Successfully registered user: {user_data.email}")
    # Create and return access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


# Route for existing user login
@router.post("/login", response_model=Token)
async def login(form_data: UserLogin):
    user = await authenticate_user(form_data.email, form_data.password)
    logger.info(f"Login attempt for email: {form_data.email}")
    if not user:
        logger.warning(f"Failed login attempt for email: {form_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    logger.info(f"User logged in successfully: {form_data.email}")
    return {"access_token": access_token, "token_type": "bearer"}


# Token auth
@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "username": current_user.username,
        "created_at": current_user.created_at,
        "profile_picture": current_user.profile_picture
    }
