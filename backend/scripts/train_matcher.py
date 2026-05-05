"""
scripts/train_matcher.py
Trains the logistic regression matcher on labelled pairs from MongoDB.
Run after enough reviewer decisions have accumulated (min 10 pairs).
Saves model to models/matcher_lr.joblib
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import numpy as np
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.labelled_pair import LabelledPair
from app.config import get_settings

FEATURE_ORDER = [
    "name_jaro_winkler", "name_token_sort", "pin_code_exact",
    "locality_similarity", "plot_similarity",
    "pan_exact", "gstin_exact", "phone_exact",
]


async def train():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(database=client[settings.mongodb_db_name], document_models=[LabelledPair])

    pairs = await LabelledPair.find().to_list()
    print(f"Found {len(pairs)} labelled pairs")

    if len(pairs) < 10:
        print("Need at least 10 labelled pairs. Use the reviewer workflow to generate them.")
        client.close()
        return

    X = np.array([[p.feature_vector.get(f, 0.0) for f in FEATURE_ORDER] for p in pairs])
    y = np.array([p.label for p in pairs])

    print(f"Class distribution: {dict(zip(*np.unique(y, return_counts=True)))}")

    if len(pairs) >= 20:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    else:
        X_train, X_test, y_train, y_test = X, X, y, y

    model = LogisticRegression(max_iter=500, class_weight="balanced", random_state=42)
    model.fit(X_train, y_train)

    print("\nFeature weights (logistic regression coefficients):")
    for feat, coef in zip(FEATURE_ORDER, model.coef_[0]):
        print(f"  {feat:<30} {coef:+.4f}")

    if len(pairs) >= 20:
        y_pred = model.predict(X_test)
        print("\nTest set performance:")
        print(classification_report(y_test, y_pred, target_names=["not_match", "match"]))

    os.makedirs("models", exist_ok=True)
    model_path = "models/matcher_lr.joblib"
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")
    client.close()


if __name__ == "__main__":
    asyncio.run(train())
