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

    # Spotify integration fields
    spotify_id: Optional[str] = None
    spotify_display_name: Optional[str] = None
    spotify_refresh_token: Optional[str] = None
    spotify_linked_at: Optional[datetime] = None
    spotify_selected_playlists: List[str] = []

    class Settings:
        name = "users"