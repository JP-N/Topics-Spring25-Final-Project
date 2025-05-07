from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from pymongo import MongoClient
from bson import ObjectId
import os
import re
from datetime import datetime
from dotenv import load_dotenv
from mumundo.backend.CoreAuth import get_current_user
from mumundo.backend.Logger import get_logger

# Load environment variables
load_dotenv()

# Logger initialization
logger = get_logger("SpotifyIntegration")

# Init MongoDB client
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.SpotifyDB

# Spotify API credentials (pls dont leak these are tied to me)
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

# Router entry point


class RatingRequest(BaseModel):
    type: str

class ReportRequest(BaseModel):
    reason: str

class SpotifyImportRequest(BaseModel):
    playlistUrl: str
    isPublic: bool = False

class UserInfo(BaseModel):
    id: str
    username: str
    profilePicture: str = "default.jpg"

class PlaylistDisplay(BaseModel):
    id: str
    name: str
    imageUrl: str = ""
    trackCount: int
    user: UserInfo

playlist_router = APIRouter(prefix="/playlists", tags=["playlist"])
# POST route to import Spotify playlists to user account
@playlist_router.post("/import-spotify")
async def import_spotify_playlist(
        request: SpotifyImportRequest,
        current_user = Depends(get_current_user)
    ):

    # Basic checks for creds and valid url
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Spotify API credentials not configured")

    if "spotify.com/playlist/" not in request.playlistUrl:
        raise HTTPException(status_code=400, detail="Invalid Spotify playlist URL")

    playlist_id = request.playlistUrl.split('playlist/')[-1].split('?')[0]

    sp = spotipy.Spotify(
        auth_manager=SpotifyClientCredentials(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET
        )
    )

    try:
        playlist = sp.playlist(playlist_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Playlist not found: {str(e)}")

    tracks = []
    results = sp.playlist_tracks(playlist_id)
    tracks.extend(results["items"])

    while results["next"]:
        results = sp.next(results)
        tracks.extend(results["items"])

    # Clean up the playlist name to avoid invalid characters
    clean_name = re.sub(r'[\\/*?:"<>|]', "", playlist["name"])

    image_url = ""
    if playlist["images"] and len(playlist["images"]) > 0:
        image_url = playlist["images"][0]["url"]

    new_playlist = {
        "Title": clean_name,
        "User": str(current_user.id),
        "Songs": [],
        "spotify_id": playlist["id"],
        "IsPublic": request.isPublic,
        "created_at": datetime.utcnow(),
        "image_url": image_url,
        "Likes": 0,
        "Dislikes": 0,
        "Saves": 0,
        "Total_Time": 0
    }

    playlist_result = db.playlist.insert_one(new_playlist)
    playlist_id = playlist_result.inserted_id

    track_count = 0
    total_time = 0

    for track_item in tracks:
        if not track_item["track"]:
            continue

        track = track_item["track"]

        existing_song = db.song.find_one({"spotify_id": track["id"]})

        if not existing_song:
            artists = ", ".join([artist["name"] for artist in track["artists"]])

            album_name = ""
            album_image = ""
            if "album" in track:
                album_name = track["album"]["name"]
                if track["album"]["images"] and len(track["album"]["images"]) > 0:
                    album_image = track["album"]["images"][0]["url"]

            new_song = {
                "Title": track["name"],
                "Artist": artists,
                "Album": album_name,
                "Length": track["duration_ms"] // 1000,
                "spotify_id": track["id"],
                "preview_url": track.get("preview_url"),
                "image_url": album_image
            }

            song_result = db.song.insert_one(new_song)
            song_id = song_result.inserted_id

            db.playlist.update_one(
                {"_id": playlist_id},
                {"$push": {"Songs": ObjectId(song_id)}}
            )

            total_time += new_song["Length"]
        else:
            db.playlist.update_one(
                {"_id": playlist_id},
                {"$push": {"Songs": ObjectId(existing_song["_id"])}}
            )

            total_time += existing_song["Length"]

        track_count += 1

    db.playlist.update_one(
        {"_id": playlist_id},
        {"$set": {"Total_Time": total_time}}
    )

    db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$push": {"playlists": str(playlist_id)}}
    )

    return {
        "message": "Playlist imported successfully",
        "playlist_id": str(playlist_id),
        "title": clean_name,
        "track_count": track_count,
        "is_public": request.isPublic,
        "image_url": image_url
    }

# GET route to fetch public playlists
@playlist_router.get("/public", response_model=List[PlaylistDisplay])
async def get_public_playlists():

    public_playlists = list(db.playlist.find({"IsPublic": True}))

    if not public_playlists:
        return []

    response_playlists = []

    # BUG FIX: Something wrong with da profile pic displaying :(
    for playlist in public_playlists:
        user_id = playlist.get("User")
        user = db.users.find_one({"_id": ObjectId(user_id)})

        if user:
            user_info = UserInfo(
                id=str(user["_id"]),
                username=user["username"],
                profilePicture=user.get("profile_picture", "default.jpg")
            )
        else:
            user_info = UserInfo(
                id=str(user_id),
                username="Unknown User",
                profilePicture="default.jpg"
            )

        image_url = playlist.get("image_url", "")

        track_count = len(playlist.get("Songs", []))

        response_playlists.append(
            PlaylistDisplay(
                id=str(playlist["_id"]),
                name=playlist["Title"],
                imageUrl=image_url,
                trackCount=track_count,
                user=user_info
            )
        )

    return response_playlists

# GET route to fetch playlists for the current user
@playlist_router.get("/user")
async def get_user_playlists(current_user = Depends(get_current_user)):
    try:

        # Find all playlists for the current user
        user_playlists = list(db.playlist.find({"User": str(current_user.id)}))

        if not user_playlists:
            return []

        formatted_playlists = []

        for playlist in user_playlists:
            formatted_playlists.append({
                "id": str(playlist["_id"]),
                "name": playlist["Title"],
                "imageUrl": playlist.get("image_url", ""),
                "trackCount": len(playlist.get("Songs", [])),
                "isPublic": playlist.get("IsPublic", False)
            })

        return formatted_playlists

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching user playlists: {str(e)}"
        )

# GET route to fetch playlist details
@playlist_router.get("/{playlist_id}")
async def get_playlist_detail(playlist_id: str):

    try:
        playlist = db.playlist.find_one({"_id": ObjectId(playlist_id)})

        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")

        user_id = playlist.get("User")
        user = db.users.find_one({"_id": ObjectId(user_id)})

        if user:
            user_info = {
                "id": str(user["_id"]),
                "username": user["username"],
                "profilePicture": user.get("profile_picture", "default.jpg")
            }
        else:
            user_info = {
                "id": str(user_id),
                "username": "Unknown User",
                "profilePicture": "default.jpg"
            }

        # Get songs
        songs_data = []
        song_ids = [ObjectId(song_id) for song_id in playlist.get("Songs", [])]

        if song_ids:
            songs = list(db.song.find({"_id": {"$in": song_ids}}))

            for song in songs:
                songs_data.append({
                    "id": str(song["_id"]),
                    "name": song["Title"],
                    "artists": [song["Artist"]],
                    "album": song["Album"],
                    "duration_ms": song["Length"] * 1000,
                    "preview_url": song.get("preview_url"),
                    "image_url": song.get("image_url", "")
                })

        # Format time
        total_time = playlist.get("Total_Time", 0)
        hours, remainder = divmod(total_time, 3600)
        minutes, seconds = divmod(remainder, 60)
        time_parts = []
        if hours:
            time_parts.append(f"{int(hours)} hr")
        if minutes:
            time_parts.append(f"{int(minutes)} min")
        if seconds or not time_parts:
            time_parts.append(f"{int(seconds)} sec")
        formatted_time = " ".join(time_parts)

        # Return formatted playlist
        return {
            "id": str(playlist["_id"]),
            "name": playlist["Title"],
            "description": playlist.get("Description", ""),
            "imageUrl": playlist.get("image_url", ""),
            "trackCount": len(song_ids),
            "tracks": songs_data,
            "user": user_info,
            "total_time": formatted_time,
            "is_public": playlist.get("IsPublic", False),
            "created_at": playlist.get("created_at", "").isoformat() if playlist.get("created_at") else None,
            "likes": playlist.get("Likes", 0),
            "dislikes": playlist.get("Dislikes", 0)
        }

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error fetching playlist: {str(e)}")

# PATCH route to update playlist visibility
@playlist_router.patch("/{playlist_id}/visibility")
async def update_playlist_visibility(
        playlist_id: str,
        data: dict,
        current_user = Depends(get_current_user)
    ):

    try:
        # Find the playlist
        playlist = db.playlist.find_one({"_id": ObjectId(playlist_id)})

        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")

        # Verify ownership
        if playlist["User"] != str(current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to modify this playlist"
            )

        # Update visibility
        is_public = data.get("isPublic", False)

        db.playlist.update_one(
            {"_id": ObjectId(playlist_id)},
            {"$set": {"IsPublic": is_public}}
        )

        return {"message": "Playlist visibility updated", "isPublic": is_public}

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating playlist visibility: {str(e)}"
        )

# DELETE route to delete a playlist
@playlist_router.delete("/{playlist_id}")
async def delete_playlist(
        playlist_id: str,
        current_user = Depends(get_current_user)
    ):

    playlist = db.playlist.find_one({"_id": ObjectId(playlist_id)})

    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Check if user is owner or admin
    is_owner = playlist["User"] == str(current_user.id)
    is_admin = hasattr(current_user, "is_admin") and current_user.is_admin

    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Permission denied")

    # Delete playlist
    db.playlist.delete_one({"_id": ObjectId(playlist_id)})
    db.users.update_one(
        {"_id": ObjectId(playlist["User"])},
        {"$pull": {"playlists": str(playlist_id)}}
    )

    return {"message": "Playlist deleted successfully"}

# POST route to rate a playlist
@playlist_router.post("/{playlist_id}/ratings")
async def rate_playlist(
        playlist_id: str,
        rating: RatingRequest,
        current_user = Depends(get_current_user)
    ):

    if rating.type not in ["like", "dislike"]:
        raise HTTPException(status_code=400, detail="Rating must be 'like' or 'dislike'")

    playlist = db.playlist.find_one({"_id": ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Check for existing rating
    existing_rating = db.playlist_ratings.find_one({
        "playlist_id": str(playlist_id),
        "user_id": str(current_user.id)
    })

    if existing_rating:
        # Update existing rating
        if existing_rating["type"] != rating.type:
            # Update counts in playlist
            update_fields = {}
            if existing_rating["type"] == "like":
                update_fields["Likes"] = playlist["Likes"] - 1
            else:
                update_fields["Dislikes"] = playlist["Dislikes"] - 1

            if rating.type == "like":
                update_fields["Likes"] = playlist["Likes"] + 1
            else:
                update_fields["Dislikes"] = playlist["Dislikes"] + 1

            db.playlist.update_one(
                {"_id": ObjectId(playlist_id)},
                {"$set": update_fields}
            )

            # Update rating
            db.playlist_ratings.update_one(
                {"_id": existing_rating["_id"]},
                {"$set": {"type": rating.type, "updated_at": datetime.utcnow()}}
            )

        return {"message": "Rating updated", "type": rating.type}
    else:
        db.playlist_ratings.insert_one({
            "playlist_id": str(playlist_id),
            "user_id": str(current_user.id),
            "type": rating.type,
            "created_at": datetime.utcnow()
        })

        update_field = "Likes" if rating.type == "like" else "Dislikes"
        db.playlist.update_one(
            {"_id": ObjectId(playlist_id)},
            {"$inc": {update_field: 1}}
        )

        return {"message": "Rating added", "type": rating.type}

# DELETE route to remove a rating
@playlist_router.delete("/{playlist_id}/ratings")
async def delete_rating(
        playlist_id: str,
        current_user = Depends(get_current_user)
    ):

    playlist = db.playlist.find_one({"_id": ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Find existing rating
    existing_rating = db.playlist_ratings.find_one({
        "playlist_id": str(playlist_id),
        "user_id": str(current_user.id)
    })

    if not existing_rating:
        raise HTTPException(status_code=404, detail="No rating found")

    update_field = "Likes" if existing_rating["type"] == "like" else "Dislikes"
    db.playlist.update_one(
        {"_id": ObjectId(playlist_id)},
        {"$inc": {update_field: -1}}
    )

    db.playlist_ratings.delete_one({"_id": existing_rating["_id"]})

    return {"message": "Rating removed"}

# GET route to fetch ratings for a playlist
@playlist_router.get("/{playlist_id}/ratings")
async def get_ratings(
        playlist_id: str,
        current_user = Depends(get_current_user)
    ):

    playlist = db.playlist.find_one({"_id": ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Get user's rating
    user_rating = db.playlist_ratings.find_one({
        "playlist_id": str(playlist_id),
        "user_id": str(current_user.id)
    })

    rating_type = user_rating["type"] if user_rating else None

    return {
        "likes": playlist["Likes"],
        "dislikes": playlist["Dislikes"],
        "user_rating": rating_type
    }

# POST route to report a playlist
@playlist_router.post("/{playlist_id}/report")
async def report_playlist(
        playlist_id: str,
        report: ReportRequest,
        current_user = Depends(get_current_user)
    ):

    playlist = db.playlist.find_one({"_id": ObjectId(playlist_id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Create report
    db.playlist_reports.insert_one({
        "playlist_id": str(playlist_id),
        "user_id": str(current_user.id),
        "reason": report.reason,
        "created_at": datetime.utcnow(),
        "status": "pending"
    })

    return {"message": "Report submitted successfully"}