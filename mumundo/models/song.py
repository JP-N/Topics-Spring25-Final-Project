from beanie import Document
from pydantic import BaseModel


class Song(Document):
    songid: int
    Likes: int
    Dislikes: int
    Playlist_count: int
    Rating: int

    class Settings:
        name = "song"

class SongRequest(BaseModel):
    Likes: int
    Dislikes: int
    Playlist_count: int
    Rating: int
