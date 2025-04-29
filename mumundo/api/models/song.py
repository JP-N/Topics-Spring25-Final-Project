from beanie import Document
from pydantic import BaseModel


class Song(Document):
    #no id, we'll use MongoDB self generated id
    Likes: int
    Dislikes: int
    Playlist_count: int
    Rating: int
    Genre: str
    Length: int

    class Settings:
        name = "song"

class SongRequest(BaseModel):
    Likes: int
    Dislikes: int
    Playlist_count: int
    Rating: int
    Genre: str
    Length: int
