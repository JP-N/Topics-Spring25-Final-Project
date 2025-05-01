import asyncio
import logging
from mumundo.backend.MongoHandler import init_db

logs_collection = None
client = None

async def log_to_db(level, logger_name, message):

    global client
    client = await init_db()

    if client is not None:
        try:

            from datetime import datetime
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S,%f")[:-3]

            log_entry = {
                "timestamp": timestamp,
                "level": level,
                "logger": logger_name,
                "message": message
            }

            logs_db = client["logs"]
            await logs_db.application_logs.insert_one(log_entry)
        except Exception as e:
            print(f"MongoDB logging error: {e}")

class MongoDBLogger:

    def __init__(self, name):
        self.name = name
        self.std_logger = logging.getLogger(name)

    def info(self, message):
        self.std_logger.info(message)
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(log_to_db("INFO", self.name, message))
        except RuntimeError:
            pass

    def error(self, message):
        self.std_logger.error(message)
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(log_to_db("ERROR", self.name, message))
        except RuntimeError:
            pass

    def warning(self, message):
        self.std_logger.warning(message)
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(log_to_db("WARNING", self.name, message))
        except RuntimeError:
            pass

    def debug(self, message):
        self.std_logger.debug(message)
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(log_to_db("DEBUG", self.name, message))
        except RuntimeError:
            pass

def get_logger(name):
    return MongoDBLogger(name)