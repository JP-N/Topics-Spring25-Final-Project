from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List
import requests
import os
from dotenv import load_dotenv

from mumundo.backend.models.song import Song
from mumundo.backend.CoreAuth import get_current_user
from mumundo.backend.routes.spotify_integration import get_spotify_client

# Load environment variables
load_dotenv()

# Spotify API credentials
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

music_router = APIRouter()

async def get_spotify_token():

    auth_response = requests.post(
        "https://accounts.spotify.com/api/token",
        data={
            "grant_type": "client_credentials",
            "client_id": SPOTIFY_CLIENT_ID,
            "client_secret": SPOTIFY_CLIENT_SECRET,
        }
    )

    if auth_response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail="Failed to get Spotify token"
        )

    auth_data = auth_response.json()
    return auth_data["access_token"]

# Song request model
class SongRequest(BaseModel):
    spotify_id: str

@music_router.get("/search")
async def search_spotify(query: str, request: Request):

    current_user = await get_current_user(request)

    if current_user:

        spotify = get_spotify_client(str(current_user.id))
        if spotify:

            results = spotify.search(q=query, type="track", limit=10)
            items = results.get("tracks", {}).get("items", [])

    else:

        token = await get_spotify_token()
        headers = {"Authorization": f"Bearer {token}"}
        params = {"q": query, "type": "track", "limit": 10}
        response = requests.get("https://api.spotify.com/v1/search", headers=headers, params=params)
        items = response.json().get("tracks", {}).get("items", [])

    return [{
        "spotify_id": i["id"],
        "Title": i["name"],
        "Artist": ", ".join([artist["name"] for artist in i["artists"]]),
        "Length": i["duration_ms"] // 1000,
        "Album": i["album"]["name"],
        "preview_url": i.get("preview_url"),
        "image_url": i["album"]["images"][0]["url"] if i["album"]["images"] else None
    } for i in items]

@music_router.post("/", response_model=Song)
async def add_music(request: SongRequest):

    token = await get_spotify_token()
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(
        f"https://api.spotify.com/v1/tracks/{request.spotify_id}",
        headers=headers
    )

    if response.status_code != 200:
        raise HTTPException(404, "Song not found on Spotify.")

    track = response.json()

    existing_song = await Song.find_one({"spotify_id": track["id"]})

    if existing_song:
        return existing_song

    song = Song(
        Title=track["name"],
        Artist=", ".join([i["name"] for i in track["artists"]]),
        Album=track["album"]["name"],
        Length=track["duration_ms"] // 1000,
        spotify_id=track["id"],
        preview_url=track.get("preview_url"),
        image_url=track["album"]["images"][0]["url"] if track["album"]["images"] else None
    )

    await song.insert()
    return song

@music_router.get("/{id}", response_model=Song)
async def get_song(id: str):

    song = await Song.get(id)
    if not song:
        raise HTTPException(404, "Song not found")
    return song

@music_router.get("", response_model=List[Song])
async def get_all_songs():

    songs = await Song.find_all().to_list()
    return songs

@music_router.delete("/{id}")
async def delete_song(id: str):

    song = await Song.get(id)
    if not song:
        raise HTTPException(404, "Song not found")
    await song.delete()
    return {"message": "Song deleted."}

ALLOWED_FIELDS = {"image_url"}

@music_router.put("/{id}", response_model=Song)
async def update_song(id: str, data: dict):

    song = await Song.get(id)
    if not song:
        raise HTTPException(404, "Song not found")

    for field, value in data.items():
        if field in ALLOWED_FIELDS:
            setattr(song, field, value)

    await song.save()
    return song