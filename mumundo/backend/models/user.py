from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional, List

class User(Document):
    email: str
    username: str
    hashed_password: str
    profile_picture: str = "default.jpg"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    bio: Optional[str] = ""
    is_admin: bool = False

    class Settings:
        name = "users"