from beanie import Document
from typing import Optional
from pydantic import BaseModel

class Song(Document):
    Title: str
    Artist: str
    Album: str = ""
    Length: int

    spotify_id: Optional[str] = None
    preview_url: Optional[str] = None

    class Settings:
        name = "songs"

class SongRequest(BaseModel):
    spotify_id: str