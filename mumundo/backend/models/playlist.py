from beanie import Document, Link
from pydantic import BaseModel
from typing import List
from mumundo.backend.models.song import Song

class Playlist(Document):
    id: str
    Title: str
    User: str
    Songs: List[Link[Song]]
    Likes: int = 0
    Dislikes: int = 0
    Saves: int = 0
    Total_Time: int = 0

    def Time(self) -> float:
        time = 0
        for song in self.songs:
            time += song.Length
        return time
    
    def total_time_str(self) -> str:
        total = self.Time()
        hours, remainder = divmod(total, 3600)
        minutes, seconds = divmod(remainder, 60)
        time_parts = []
        if hours:
            time_parts.append(f"{hours} hr")
        if minutes:
            time_parts.append(f"{minutes} min")
        time_parts.append(f"{seconds} sec")

        return " ".join(time_parts)

    def Rating(self) -> float:
        return self.likes / max(self.Dislikes, 1)

    class Settings:
        name = "playlist"

class PlaylistRequest(BaseModel):
    Title: str
    User: str
