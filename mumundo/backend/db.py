from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from mumundo.backend.user import User
import os
from dotenv import load_dotenv

load_dotenv()

password = os.getenv("MONGO_PASSWORD")
uri_template = os.getenv("MONGO_URI_TEMPLATE")
full_uri = uri_template.replace("<db_password>", password)

async def init_db():
    client = AsyncIOMotorClient(full_uri)
    db = client["Cluster0"]
    await init_beanie(database=db, document_models=[User])