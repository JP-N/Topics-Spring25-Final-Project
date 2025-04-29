from fastapi import APIRouter, Path, HTTPException, status, Depends, Body
from pydantic import BaseModel
from typing import List
import requests

from mumundo.models.song import SongRequest, Song

music_router = APIRouter()


@music_router.get("/search")
def fetch_Spotify(query: str):
    headers = {"Authorization": f"Bearer {SPOTIFYTOKEN}"}
    params = {"q": query, "type": "track", "limit": 10}
    response = requests.get("https://api.spotify.com/v1/search", headers=headers, params=params)
    items = response.json().get("tracks", {}).get("items", [])

    return[{
        "spotify_id": i["id"],
            "title": i["name"],
            "artist": ", ".join([artist["name"] for artist in i["artists"]]),
            "length": i["duration_ms"] // 1000,
            "album": i["album"]["name"]
    }for i in items
    ]


@music_router.post("/", response_model= Song)
async def add_music(request: SongRequest):
    headers = {"Authorization": f"Bearer {SPOTIFYTOKEN}"}
    response = requests.get(f"https://api.spotify.com/v1/tracks/{request.spotify_id}",headers = headers)
    if response.status_code != 200:
        raise HTTPException(404, "Song not found on Spotify.")
    track = response.json()

    song = Song(
        spotify_id=track["id"],
        title=track["name"],
        artist=", ".join([i["name"] for i in track["artists"]]),
        length=track["duration_ms"] // 1000,
        image_url=track["album"]["images"][0]["url"]
    )
    await song.insert()
    return song

@music_router.get("/{id}", response_model=Song)
async def get_song(id: str):
    song = await Song.get(id)
    if not song:
        raise HTTPException(404, "Song not found")
    return song

@music_router.get("", response_model = List[Song])
async def get_all_songs():
    songs = await Song.find_all().to_list()
    return songs

@music_router.delete("/{id}")
async def delete_song(id:str):
    song = await Song.get(id)
    if not song:
        raise HTTPException(404, "Song not found")
    await song.delete()
    return {"message": "Song deleted."}

ALLOWED_FIELDS = {"Image_url"}

@music_router.put("/{id}", response_model = Song)
async def update_song(id:str, data:dict):
    song = await Song.get(id)
    if not song:
        raise HTTPException(404, "Song not found")
    for field, value in data.items():
        if field in ALLOWED_FIELDS:
            setattr(song, field, value)

    await song.save()
    return song
    
