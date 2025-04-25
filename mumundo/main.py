from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from mumundo.backend.auth import router as auth_router
from mumundo.backend.music import music_router
from mumundo.backend.user import User
from mumundo.backend.db import init_db
import logging

logging.basicConfig(
    filename="app.log",
    format="%(asctime)s: %(name)s: %(levelname).4s - %(message)s",
    level=logging.INFO,
)


app = FastAPI(title="Mumundo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(music_router, prefix="/music", tags=["music"])

@app.on_event("startup")
async def startup_event():
    
    await init_db()

    try:

        from mumundo.backend.auth import get_user_by_email
        dummy_email = "dummy@example.com"
        existing_user = await get_user_by_email(dummy_email)

        if not existing_user:
            from mumundo.backend.auth import get_password_hash
            hashed_password = get_password_hash("password5")

            dummy_user = User(
                username="dummyuser",
                email=dummy_email,
                hashed_password=hashed_password
            )
            await dummy_user.insert()
    except Exception as e:
        print(f"Error creating dummy user: {e}")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Mumundo API! Visit /music to see the data! Enjoy!"}
