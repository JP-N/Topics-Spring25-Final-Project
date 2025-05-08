from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

load_dotenv(dotenv_path=".env")

from mumundo.backend.models.user import User
from mumundo.backend.MongoHandler import init_db
from mumundo.backend.Logger import get_logger

from mumundo.backend.CoreAuth import auth_router
from mumundo.backend.routes.admin import admin_router
from mumundo.backend.routes.spotify_integration import playlist_router
# from mumundo.backend.routes.music import music_router
from mumundo.backend.routes.profile import profile_router

logger = get_logger("MainServer")
app = FastAPI(title="Mumundo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router, prefix="/api")
#app.include_router(music_router, prefix="/music", tags=["music"])
app.include_router(profile_router, prefix="/api")
app.include_router(playlist_router, prefix="/api", tags=["playlists"])
@app.on_event("startup")
async def startup_event():

    await init_db()

    try:

        from mumundo.backend.CoreAuth import get_user_by_email
        dummy_email = "dummy@example.com"
        existing_user = await get_user_by_email(dummy_email)

        if not existing_user:
            from mumundo.backend.CoreAuth import get_password_hash
            hashed_password = get_password_hash("password5")

            dummy_user = User(
                username="dummyuser",
                email=dummy_email,
                hashed_password=hashed_password
            )
            await dummy_user.insert()
    except Exception as e:
        print(f"Error creating dummy user: {e}")


UPLOAD_DIR = os.path.join(os.getcwd(), "backend", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Mumundo API! Visit /music to see the data! Enjoy!"}
