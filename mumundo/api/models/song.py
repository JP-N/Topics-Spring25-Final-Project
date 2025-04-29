from beanie import Document
from pydantic import BaseModel


class Song(Document):
    Spotify_id: int
    Likes: int = 0
    Dislikes: int = 0
    Playlist_count: int = 0
    Genre: str | None
    Length: int # in seconds

    def rating(self):
        return self.likes / max(self.dislikes, 1)
    class Settings:
        name = "song"

class SongRequest(BaseModel):
    Spotify_id: int
