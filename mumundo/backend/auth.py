from fastapi import APIRouter, HTTPException, status, File, UploadFile, Depends
from pydantic import BaseModel, EmailStr
from user import User
from security import hash_password, verify_password
import os
from datetime import datetime, timedelta, timezone
import jwt


SECRET_KEY = "2a33c01bffbd1620f710c408f0a630f839e449b4c3356a15866347f9416bdef5"
ALGORITHM = "HS256"

auth_router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class TokenData(BaseModel):
    username: str
    exp_datetime: datetime

UPLOAD_DIR = "uploaded_pics"

#ensure the upload directory exists
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=15)):
    payload = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    payload.update({"exp": expire})
    encoded = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded

def decode_jwt_token(token: str) -> TokenData | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        exp: int = payload.get("exp")
        return TokenData(username=username, exp_datetime=datetime.fromtimestamp(exp))
    except jwt.InvalidTokenError:
        return None

@auth_router.post("/register")
async def register(user: UserCreate, pfp: UploadFile = File(None)):
    # Check if user already exists
    existing = await User.find_one(User.email == user.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

    #handle profile picture upload (if provided)
    profile_picture = "default.jpg"

    if pfp:
        file_location = os.path.join(UPLOAD_DIR, pfp.filename)
        with open(file_location, "wb") as file:
            file.write(await pfp.read())
        profile_picture = pfp.filename  #update the profile picture filename
    
    #hash password
    hashed_pw = hash_password(user.password)
    
    #create a new user object
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_pw,
        profile_picture=profile_picture
    )
    
    #save the user to the database
    await new_user.insert()

    return {"message": "User registered successfully!"}

#login route to create access token
class Token(BaseModel):
    access_token: str
    token_type: str

@auth_router.post("/token", response_model=Token)
async def login_for_access_token(form_data: UserCreate):
    #check if user exists
    user = await User.find_one(User.email == form_data.email)
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    #create access token
    token = create_access_token({"username": user.username})

    return {"access_token": token, "token_type": "bearer"}

#protect routes with JWT (example route)
@auth_router.get("/users/me")
async def read_users_me(token: str = Depends(decode_jwt_token)):
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid or expired token"
        )
    return {"username": token.username}

#dummy user test
@auth_router.get("/create_dummy_user")
async def create_dummy_user():
    dummy = await User.find_one(User.email == "dummy@example.com")
    if dummy:
        return {"message": "Dummy user already exists."}

    user = User(
        email ="dummy@example.com",
        username ="dummy",
        hashed_password =hash_password("dummy123"),
        profile_picture ="default.jpg"
    )
    await user.insert()
    return {"message": "Dummy user created."}