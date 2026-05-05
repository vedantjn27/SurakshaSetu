from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import yaml
import os


class Settings(BaseSettings):
    # MongoDB Atlas
    mongodb_url: str
    mongodb_db_name: str = "suraksha_setu"

    # Mistral AI
    mistral_api_key: str
    mistral_model: str = "mistral-small-latest"

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    # Scrambler
    scrambler_secret_seed: str

    # App
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def rules(self) -> dict:
        """Load rules.yaml once and cache."""
        rules_path = os.path.join(os.path.dirname(__file__), "..", "config", "rules.yaml")
        rules_path = os.path.abspath(rules_path)
        with open(rules_path, "r") as f:
            return yaml.safe_load(f)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
