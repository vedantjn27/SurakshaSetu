import sys
from loguru import logger
from app.config import get_settings


def setup_logging():
    settings = get_settings()
    logger.remove()
    logger.add(
        sys.stdout,
        level=settings.log_level,
        format=(
            "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{name}</cyan>:<cyan>{line}</cyan> — "
            "<level>{message}</level>"
        ),
        colorize=True,
    )
    logger.add(
        "logs/suraksha_{time:YYYY-MM-DD}.log",
        rotation="1 day",
        retention="7 days",
        level="DEBUG",
        format="{time} | {level} | {name}:{line} — {message}",
        serialize=True,
    )


setup_logging()
__all__ = ["logger"]
