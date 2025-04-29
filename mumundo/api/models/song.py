from beanie import Document
from pydantic import BaseModel


class Song(Document):
    Spotify_id: int
    Title: str
    Artist: str
    Length: int # in seconds
    Likes: int = 0
    Dislikes: int = 0
    Playlist_count: int = 0

    def rating(self):
        return self.likes / max(self.dislikes, 1)
    class Settings:
        name = "song"

class SongRequest(BaseModel):
    Spotify_id: int
