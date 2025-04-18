from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from music import music_router

app = FastAPI()

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
