from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from pymongo import MongoClient
from beanie import Document, Link, PydanticObjectId
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import os
from dotenv import load_dotenv

from mumundo.backend.CoreAuth import get_current_user
from mumundo.backend.models.song import Song

load_dotenv(dotenv_path="mumundo/backend/.env")

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8000/api/spotify/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SPOTIFY_SCOPE = "user-read-private user-read-email playlist-read-private playlist-read-collaborative"

MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.Cluster0

class Playlist(Document):
    Title: str
    User: str
    Songs: List[Link[Song]]
    Likes: int = 0
    Dislikes: int = 0
    Saves: int = 0
    Total_Time: int = 0
    spotify_id: Optional[str] = None

    def Time(self) -> float:
        time = 0
        for song in self.Songs:
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
        return self.Likes / max(self.Dislikes, 1)

    class Settings:
        name = "playlist"

class PlaylistRequest(BaseModel):
    Title: str
    User: str

class SpotifyStatus(BaseModel):
    linked: bool
    username: Optional[str] = None

class SpotifyPlaylist(BaseModel):
    id: str
    name: str
    images: List[Dict[str, str]]
    tracks: Dict[str, int]

class SelectedPlaylists(BaseModel):
    playlistIds: List[str] = Field(default_factory=list)

class SpotifyPlaylistImport(BaseModel):
    playlist_id: str

class PublicPlaylistResponse(BaseModel):
    id: str
    name: str
    imageUrl: str
    trackCount: int
    user: dict

def get_spotify_client(user_id: str):
    user_data = db.users.find_one({"_id": PydanticObjectId(user_id)})

    if not user_data or "spotify_refresh_token" not in user_data:
        return None

    auth_manager = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope=SPOTIFY_SCOPE
    )

    token_info = auth_manager.refresh_access_token(user_data["spotify_refresh_token"])
    return spotipy.Spotify(auth=token_info["access_token"])

spotify_router = APIRouter(prefix="/spotify", tags=["spotify"])
playlist_router = APIRouter(prefix="/playlists", tags=["playlist"])

@spotify_router.get("/auth")
async def spotify_auth(request: Request):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    request.session["user_id"] = str(current_user.id)

    sp_oauth = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope=SPOTIFY_SCOPE
    )

    auth_url = sp_oauth.get_authorize_url()

    return RedirectResponse(url=auth_url)

@spotify_router.get("/callback")
async def spotify_callback(request: Request, code: str):

    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=auth_required")

    sp_oauth = SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scope=SPOTIFY_SCOPE
    )

    token_info = sp_oauth.get_access_token(code)

    sp = spotipy.Spotify(auth=token_info["access_token"])

    spotify_user = sp.current_user()

    db.users.update_one(
        {"_id": PydanticObjectId(user_id)},
        {
            "$set": {
                "spotify_id": spotify_user["id"],
                "spotify_display_name": spotify_user["display_name"],
                "spotify_refresh_token": token_info["refresh_token"],
                "spotify_linked_at": datetime.utcnow(),
                "spotify_selected_playlists": []
            }
        }
    )

    return RedirectResponse(url=f"{FRONTEND_URL}/profile?spotify=success")

@spotify_router.get("/status", response_model=SpotifyStatus)
async def spotify_status(request: Request):
    """Check if user has linked Spotify account"""
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_data = db.users.find_one({"_id": PydanticObjectId(current_user.id)})

    if user_data and "spotify_refresh_token" in user_data:
        return SpotifyStatus(
            linked=True,
            username=user_data.get("spotify_display_name")
        )

    return SpotifyStatus(linked=False)

@spotify_router.get("/playlists", response_model=List[SpotifyPlaylist])
async def get_spotify_playlists(request: Request):
    """Get all playlists from user's Spotify account"""
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    sp = get_spotify_client(str(current_user.id))
    if not sp:
        raise HTTPException(status_code=401, detail="Spotify account not linked")

    results = sp.current_user_playlists()
    playlists = results["items"]

    while results["next"]:
        results = sp.next(results)
        playlists.extend(results["items"])

    formatted_playlists = []
    for playlist in playlists:
        formatted_playlists.append(
            SpotifyPlaylist(
                id=playlist["id"],
                name=playlist["name"],
                images=playlist["images"],
                tracks={"total": playlist["tracks"]["total"]}
            )
        )

    return formatted_playlists

@spotify_router.post("/selected-playlists")
async def save_selected_playlists(selected: SelectedPlaylists, request: Request):

    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db.users.update_one(
        {"_id": PydanticObjectId(current_user.id)},
        {"$set": {"spotify_selected_playlists": selected.playlistIds}}
    )

    return {"message": "Selected playlists saved successfully"}

@spotify_router.get("/selected-playlists", response_model=List[str])
async def get_selected_playlists(request: Request):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_data = db.users.find_one({"_id": PydanticObjectId(current_user.id)})

    if not user_data:
        return []

    return user_data.get("spotify_selected_playlists", [])

@playlist_router.get("/public", response_model=List[PublicPlaylistResponse])
async def get_public_playlists():

    users = list(db.users.find(
        {"spotify_selected_playlists": {"$exists": True, "$ne": []}}
    ))

    if not users:
        return []

    public_playlists = []

    for user in users:

        if not user.get("spotify_refresh_token") or not user.get("spotify_selected_playlists"):
            continue

        sp = get_spotify_client(str(user["_id"]))

        if not sp:
            continue

        for playlist_id in user.get("spotify_selected_playlists", []):
            try:
                playlist = sp.playlist(playlist_id)

                public_playlists.append(
                    PublicPlaylistResponse(
                        id=playlist["id"],
                        name=playlist["name"],
                        imageUrl=playlist["images"][0]["url"] if playlist["images"] else "",
                        trackCount=playlist["tracks"]["total"],
                        user={
                            "id": str(user["_id"]),
                            "username": user["username"],
                            "profilePicture": user.get("profile_picture", "default.jpg")
                        }
                    )
                )
            except Exception:
                continue

    return public_playlists

@playlist_router.post("/", response_model=Playlist)
async def create_playlist(data: PlaylistRequest):
    """Create a new playlist"""
    playlist = Playlist(Title=data.Title, User=data.User, Songs=[])
    await playlist.insert()
    return playlist

@playlist_router.post("/{playlist_id}/add_music/{song_id}")
async def add_song_to_playlist(playlist_id: str, song_id: str):
    """Add a song to a playlist"""
    playlist = await Playlist.get(playlist_id)
    song = await Song.get(song_id)
    if not playlist or not song:
        raise HTTPException(404, "Playlist or Song not found.")
    if song in playlist.Songs:
        return {"message": "Song already in playlist."}
    playlist.Songs.append(song)
    await playlist.save()
    return {"message": "Song added to playlist."}

@playlist_router.post("/{playlist_id}/remove_song/{song_id}")
async def remove_song_from_playlist(playlist_id: str, song_id: str):
    """Remove a song from a playlist"""
    playlist = await Playlist.get(playlist_id)
    if not playlist:
        raise HTTPException(404, "Playlist not found.")
    playlist.Songs = [s for s in playlist.Songs if str(s.id) != song_id]
    await playlist.save()
    return {"message": "Song removed from playlist."}

@playlist_router.get("/{playlist_id}", response_model=Playlist)
async def get_playlist(playlist_id: str):
    try:

        playlist = await Playlist.get(playlist_id, fetch_links=True)
    except Exception:
        try:

            playlist = await Playlist.get(PydanticObjectId(playlist_id), fetch_links=True)
        except Exception:
            raise HTTPException(404, "Playlist not found.")

    if not playlist:
        raise HTTPException(404, "Playlist not found.")

    playlist.Total_Time = playlist.total_time_str()
    return playlist

@playlist_router.get("/", response_model=List[Playlist])
async def get_all_playlists():
    """Get all playlists"""
    playlists = await Playlist.find_all(fetch_links=True).to_list()
    for playlist in playlists:
        playlist.Total_Time = playlist.total_time_str()
    return playlists

@playlist_router.post("/import-from-spotify")
async def import_spotify_playlist(data: SpotifyPlaylistImport, request: Request):
    current_user = await get_current_user(request)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    sp = get_spotify_client(str(current_user.id))
    if not sp:
        raise HTTPException(status_code=401, detail="Spotify account not linked")

    try:
        playlist = sp.playlist(data.playlist_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Playlist not found")

    tracks = []
    results = sp.playlist_tracks(data.playlist_id)
    tracks.extend(results["items"])

    while results["next"]:
        results = sp.next(results)
        tracks.extend(results["items"])

    new_playlist = Playlist(
        Title=playlist["name"],
        User=str(current_user.id),
        Songs=[],
        spotify_id=playlist["id"],
        Total_Time=sum(track["track"]["duration_ms"] // 1000 for track in tracks if track["track"] and "duration_ms" in track["track"])
    )

    await new_playlist.insert()

    for track_item in tracks:
        if not track_item["track"]:
            continue

        track = track_item["track"]

        existing_song = await Song.find_one({"spotify_id": track["id"]})

        if not existing_song:

            artists = ", ".join([artist["name"] for artist in track["artists"]])

            new_song = Song(
                Title=track["name"],
                Artist=artists,
                Album=track["album"]["name"] if "album" in track else "",
                Length=track["duration_ms"] // 1000,
                spotify_id=track["id"],
                preview_url=track.get("preview_url")
            )

            await new_song.insert()
            new_playlist.Songs.append(new_song)
        else:
            new_playlist.Songs.append(existing_song)

    await new_playlist.save()

    return {"message": "Playlist imported successfully", "playlist_id": str(new_playlist.id)}



@playlist_router.get("/spotify/{playlist_id}")
async def get_spotify_playlist(playlist_id: str):

    user = db.users.find_one({"spotify_selected_playlists": playlist_id})

    if not user:
        raise HTTPException(status_code=404, detail="Playlist not found")

    sp = get_spotify_client(str(user["_id"]))

    if not sp:
        raise HTTPException(status_code=404, detail="Cannot access playlist")

    playlist = sp.playlist(playlist_id)

    tracks = []
    results = sp.playlist_tracks(playlist_id, limit=100)

    for item in results["items"]:
        if item["track"]:
            track = item["track"]
            tracks.append({
                "id": track["id"],
                "name": track["name"],
                "artists": [artist["name"] for artist in track["artists"]],
                "album": track["album"]["name"],
                "duration_ms": track["duration_ms"],
                "preview_url": track.get("preview_url")
            })

    return {
        "id": playlist["id"],
        "name": playlist["name"],
        "description": playlist["description"],
        "imageUrl": playlist["images"][0]["url"] if playlist["images"] else "",
        "trackCount": playlist["tracks"]["total"],
        "tracks": tracks,
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "profilePicture": user.get("profile_picture", "default.jpg")
        }
    }