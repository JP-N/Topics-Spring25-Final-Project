from beanie import Document
from pydantic import EmailStr, Field
from datetime import datetime

class User(Document):
    email: EmailStr
    username: str
    hashed_password: str
    profile_picture: str = "default.jpg"
    created_at: datetime = Field(default_factory = datetime.utcnow)

    class Settings:
        name = "users"