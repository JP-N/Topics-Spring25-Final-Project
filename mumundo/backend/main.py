from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from music import music_router
from db import init_db
from auth import auth_router
from user import User

app = FastAPI()

app.include_router(auth_router, prefix = "/auth", tags = ["auth"])

@app.on_event("startup")
async def start_db():
    await init_db()

    dummy_user = User(username = "dummyuser", email = "dummy@example.com", hashed_password = "password5")
    await dummy_user.insert()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

app.include_router(music_router, prefix = "/music", tags = ["music"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Music API! Visit /music to see the data! Enjoy!"}