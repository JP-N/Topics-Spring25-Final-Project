from typing import List
from fastapi import APIRouter, HTTPException
from models.playlist import Playlist, PlaylistRequest
from mumundo.models.song import Song

from mumundo.models.playlist import Playlist

playlist_router = APIRouter()

@playlist_router.post("/", response_model=Playlist)
async def create_playlist(data: PlaylistRequest):
    playlist = Playlist(name=data.name, user="test", songs=[])
    await playlist.insert()
    return playlist

@playlist_router.post("/{playlist_id}/add_music/{song_id}")
async def add_song_to_playlist(playlist_id: str, song_id: str):
    playlist = await Playlist.get(playlist_id)
    song = await Song.get(song_id)
    if not playlist or not song:
        raise HTTPException(404, "Playlist or Song not found.")
    if song in playlist.songs:
        return {"message": "Song already in playlist."}
    playlist.songs.append(song)
    await playlist.save()
    return {"message": "Song added to playlist."}

@playlist_router.post("/{playlist_id}/remove_song/{song_id}")
async def remove_song_from_playlist(playlist_id: str, song_id: str):
    playlist = await Playlist.get(playlist_id)
    if not playlist:
        raise HTTPException(404, "Playlist not found.")
    playlist.songs = [s for s in playlist.songs if str(s.id) != song_id]
    await playlist.save()
    return {"message": "Song removed from playlist."}

@playlist_router.get("/{playlist_id}", response_model=Playlist)
async def get_playlist(playlist_id: str):
    playlist = await Playlist.get(playlist_id, fetch_links=True)
    if not playlist:
        raise HTTPException(404, "Playlist not found.")
    playlist.Total_Time = playlist.total_time_str()
    return playlist

@playlist_router.get("/", response_model=List[Playlist])
async def get_all_playlists():
    playlists = await Playlist.find_all(fetch_links=True).to_list()
    for playlist in playlists:
        playlist.Total_Time = playlist.total_time_str()

    return playlists
