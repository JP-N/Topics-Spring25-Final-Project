from aiohttp.web_fileresponse import FileResponse
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from pymongo import MongoClient
from beanie import PydanticObjectId
import os
import shutil
from mumundo.backend.Logger import get_logger
import uuid
from mumundo.backend.models.user import User
from mumundo.backend.CoreAuth import get_current_user
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Logger initialization
logger = get_logger("UserProfile")

# Router entry point
profile_router = APIRouter(prefix="/user", tags=["user"])

UPLOAD_DIR = os.path.join(os.getcwd(), "backend", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Init MongoDB client
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.UserDB

# GET route to fetch user profile
@profile_router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):

    logger.error("get_profile")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_dict = user.dict()
    user_dict.pop("hashed_password", None)

     #create the full URL for the profile picture
    profile_picture_url = f"http://localhost:8000/uploads/{user.profile_picture}"
    
    #add the profile picture URL to the response data
    user_dict["profile_picture_url"] = profile_picture_url

    return user_dict

# POST route to update user profile
@profile_router.patch("/profile")
async def update_profile(
        username: str = Form(...),
        bio: str = Form(""),
        profile_picture: UploadFile = File(None),
        user: User = Depends(get_current_user)
    ):

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Update in MongoDB
    update_data = {
        "username": username,
        "bio": bio,
    }

    # If a new profile picture is provided to a valid profile, save it
    if profile_picture and profile_picture.filename:

        file_ext = os.path.splitext(profile_picture.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"

        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_picture.file, buffer)

        update_data["profile_picture"] = unique_filename

    result = db.users.update_one(
        {"_id": PydanticObjectId(user.id)},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Update failed")

    return {"message": "Profile updated successfully"}

# GET route to fetch user profile picture
@profile_router.get("/profile-picture/{user_id}")
async def get_profile_picture(user_id: str):

    user = db.users.find_one({"_id": ObjectId(user_id)})
    print(user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get profile picture path
    picture = user.get("profile_picture", "default.jpg")

    # If it's the default picture, serve from static folder
    if picture == "default.jpg":
        return FileResponse("default.jpg")

    # Otherwise, serve from uploads folder
    picture_path = os.path.join(UPLOAD_DIR, picture)

    # Check if file exists
    if not os.path.isfile(picture_path):
        return FileResponse("default.jpg")

    return FileResponse(picture_path)

# GET route to fetch user selected public playlists
@profile_router.get("/selected-playlists")
async def get_user_selected_playlists(user: User = Depends(get_current_user)):

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_data = db.users.find_one({"_id": PydanticObjectId(user.id)})

    if not user_data or "spotify_selected_playlists" not in user_data:
        return []

    return user_data.get("spotify_selected_playlists", [])