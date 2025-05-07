import os
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import List
from datetime import datetime
from pymongo import MongoClient
from mumundo.backend.CoreAuth import get_current_user
from mumundo.backend.MongoHandler import



global db
db = await init_db()

admin_router = APIRouter(prefix="/admin", tags=["admin"])

@admin_router.get("/reports")
async def get_reports(current_user = Depends(get_current_user)):
    # Check if user is admin
    if not hasattr(current_user, "is_admin") or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Get all reports with playlist and user info
    reports = list(db.playlist_reports.find().sort("created_at", -1))

    if not reports:
        return []

    formatted_reports = []

    for report in reports:

        playlist = db.playlist.find_one({"_id": ObjectId(report["playlist_id"])})
        user = db.users.find_one({"_id": ObjectId(report["user_id"])})

        if playlist and user:
            formatted_reports.append({
                "id": str(report["_id"]),
                "playlist_id": report["playlist_id"],
                "playlist_name": playlist["Title"],
                "user_id": report["user_id"],
                "username": user["username"],
                "reason": report["reason"],
                "created_at": report["created_at"].isoformat() if isinstance(report["created_at"], datetime) else report["created_at"],
                "status": report["status"]
            })

    return formatted_reports

@admin_router.post("/reports/{report_id}/dismiss")
async def dismiss_report(report_id: str, current_user = Depends(get_current_user)):
    # Check if user is admin
    if not hasattr(current_user, "is_admin") or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    # Update report status
    result = db.playlist_reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"status": "dismissed", "reviewed_by": str(current_user.id), "reviewed_at": datetime.utcnow()}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")

    return {"message": "Report dismissed"}

@admin_router.post("/reports/{report_id}/delete")
async def delete_reported_playlist(report_id: str, current_user = Depends(get_current_user)):

    if not hasattr(current_user, "is_admin") or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    report = db.playlist_reports.find_one({"_id": ObjectId(report_id)})

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    playlist = db.playlist.find_one({"_id": ObjectId(report["playlist_id"])})

    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    db.playlist.delete_one({"_id": ObjectId(report["playlist_id"])})

    # Remove playlist from user's playlists
    db.users.update_one(
        {"_id": ObjectId(playlist["User"])},
        {"$pull": {"playlists": str(report["playlist_id"])}}
    )

    # Update report status
    db.playlist_reports.update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"status": "reviewed", "reviewed_by": str(current_user.id), "reviewed_at": datetime.utcnow()}}
    )

    return {"message": "Reported playlist deleted"}