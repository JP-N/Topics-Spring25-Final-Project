from beanie import Document
from pydantic import BaseModel


class Playlist(Document):
    Playlistid: int
    Likes: int
    Dislikes: int
    Rating: int

    class Settings:
        name = "playlist"

class PlaylistRequest(BaseModel):
    Likes: int
    Dislikes: int
    Rating: int
