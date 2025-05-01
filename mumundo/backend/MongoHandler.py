from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from mumundo.backend.models.user import User
from dotenv import load_dotenv
import logging
import asyncio

load_dotenv()

logger = logging.getLogger(__name__)
full_uri = "mongodb+srv://jpnoga:dfdIQMOCMgYEB83N@mumundo.ecyyd6x.mongodb.net/?retryWrites=true&w=majority&appName=mumundo"



async def init_db():

    global client, logs_client

    logging.basicConfig(
        filename="app.log",
        format="%(asctime)s: %(name)s: %(levelname)s - %(message)s",
        level=logging.INFO,
    )

    try:

        client = AsyncIOMotorClient(full_uri)
        logger.info("Database client created")

        logs_client = AsyncIOMotorClient(full_uri)
        logger.info("Logs database client created")

        app_db = client["Cluster0"]
        await init_beanie(database=app_db, document_models=[User])
        logger.info("Application database initialized with Beanie")


        return client
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise