"""
services/explainer.py
Calls Mistral API to generate plain-English explanations.
ONLY operates on scrambled/synthetic data — never raw PII.
Falls back to template explanations if API is unavailable.
"""
import httpx
from typing import Optional
from app.config import get_settings
from app.core.logger import logger

MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"


async def explain_match(
    scr_name_a: str,
    scr_name_b: str,
    features: dict,
    score: float,
    decision: str,
) -> str:
    """
    Generate a plain-English explanation for a match decision.
    Input MUST be scrambled names — enforced by caller.
    """
    prompt = (
        f"You are a data quality analyst explaining a business record linkage decision.\n"
        f"Two business records are being compared:\n"
        f"  Record A: '{scr_name_a}'\n"
        f"  Record B: '{scr_name_b}'\n"
        f"Matching signals:\n"
        f"  - Name similarity (Jaro-Winkler): {features.get('name_jaro_winkler', 0):.2f}\n"
        f"  - Name token sort ratio: {features.get('name_token_sort', 0):.2f}\n"
        f"  - Pin code match: {'Yes' if features.get('pin_code_exact', 0) == 1.0 else 'No'}\n"
        f"  - Locality similarity: {features.get('locality_similarity', 0):.2f}\n"
        f"  - PAN identifier match: {'Yes' if features.get('pan_exact', 0) == 1.0 else 'No'}\n"
        f"  - GSTIN identifier match: {'Yes' if features.get('gstin_exact', 0) == 1.0 else 'No'}\n"
        f"Confidence score: {score:.2f}\n"
        f"Decision: {decision.replace('_', ' ').upper()}\n\n"
        f"Write 2-3 sentences explaining why the system made this decision, "
        f"in plain English for a government analyst. Be specific about which signals "
        f"drove the decision and what is uncertain."
    )

    try:
        settings = get_settings()
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                MISTRAL_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.mistral_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.mistral_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.3,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    except Exception as e:
        logger.warning(f"Mistral API call failed: {e}. Using template explanation.")
        return _template_explanation(features, score, decision)


async def explain_classification(
    ubid: str,
    status: str,
    score: float,
    evidence: list,
) -> str:
    """Generate plain-English explanation for activity classification."""
    top_evidence = "\n".join(f"  - {e}" for e in evidence[:5])
    prompt = (
        f"A business entity has been classified as '{status}' based on its activity.\n"
        f"Activity score: {score:.3f}\n"
        f"Key evidence signals:\n{top_evidence}\n\n"
        f"Write 2-3 sentences explaining this classification in plain English "
        f"for a Karnataka Commerce & Industries analyst. "
        f"Mention the key signals that drove the decision."
    )

    try:
        settings = get_settings()
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                MISTRAL_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.mistral_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.mistral_model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.3,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.warning(f"Mistral API failed for classification explanation: {e}")
        return f"Classified as {status} with activity score {score:.3f}. Evidence: {'; '.join(evidence[:3])}"


def _template_explanation(features: dict, score: float, decision: str) -> str:
    """Fallback when Mistral API is unavailable."""
    pan_hit = features.get("pan_exact", 0) == 1.0
    gstin_hit = features.get("gstin_exact", 0) == 1.0
    name_sim = features.get("name_jaro_winkler", 0)
    pin_match = features.get("pin_code_exact", 0) == 1.0

    parts = []
    if pan_hit:
        parts.append("PAN identifiers match exactly (near-deterministic anchor)")
    if gstin_hit:
        parts.append("GSTIN identifiers match exactly")
    if name_sim > 0.8:
        parts.append(f"Business names are highly similar ({name_sim:.0%})")
    elif name_sim > 0.5:
        parts.append(f"Business names are moderately similar ({name_sim:.0%})")
    if pin_match:
        parts.append("pin codes match")

    if not parts:
        parts.append("no strong matching signals found")

    return (
        f"Score {score:.2f} → {decision.replace('_', ' ')}. "
        f"{'; '.join(parts).capitalize()}."
    )
