"""
main_detector.py — Motor de análisis: similitud de texto + scoring de metadatos
                   + filtrado de palabras clave (ScamFilter).

Uso integrado:
    from main_detector import BotDetector
    detector = BotDetector(threshold=0.85)
    findings = detector.run_detection(post_batch)
"""

import difflib
import json
from datetime import datetime

from keyword_engine import ScamFilter  # Motor de análisis de contenido malicioso


class BotDetector:
    def __init__(self, threshold: float = 0.8):
        # Umbral de similitud: 0.85 = 85% de texto idéntico para marcar como sospechoso
        self.threshold = threshold
        self.suspect_database = []
        self.scam_filter = ScamFilter()  # Motor de palabras clave

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Ratio de similitud entre dos cadenas (0.0 → 1.0)."""
        return difflib.SequenceMatcher(None, text1, text2).ratio()

    def analyze_account_metadata(self, account_data: dict) -> int:
        """
        Puntúa el riesgo de automatización de una cuenta (0–100).
        Campos esperados: created_at (YYYY-MM-DD), followers, is_default_pfp
        """
        score = 0
        days_old = (
            datetime.now() - datetime.strptime(account_data["created_at"], "%Y-%m-%d")
        ).days

        if days_old < 90:                        score += 30   # Cuenta nueva
        if account_data["followers"] < 10:       score += 40   # Sin seguidores
        if account_data.get("is_default_pfp"):   score += 20   # Foto por defecto

        return score

    def run_detection(self, post_batch: list) -> list:
        """
        Compara todos los pares de posts y devuelve los que superan el umbral.

        Riesgo total = (scam_score × 0.6) + (metadata_score × 0.4)
            CRÍTICO  → total_risk > 70
            ALTO     → total_risk > 40
            BAJO     → resto

        post_batch: lista de dicts con {user, text, metadata}
        """
        results = []

        for i, post1 in enumerate(post_batch):
            for j, post2 in enumerate(post_batch):
                if i >= j:
                    continue  # Evitar duplicados y auto-comparación

                similarity = self.calculate_similarity(post1["text"], post2["text"])

                if similarity > self.threshold:
                    # Análisis de contenido malicioso
                    scam_score, flags = self.scam_filter.analyze_text(post1["text"])
                    metadata_score = self.analyze_account_metadata(post1["metadata"])

                    # Promedio ponderado: 60 % contenido + 40 % metadatos
                    total_risk = (scam_score * 0.6) + (metadata_score * 0.4)

                    results.append({
                        "users": [post1["user"], post2["user"]],
                        "similarity": round(similarity, 2),
                        "content_sample": post1["text"][:100],
                        "scam_score": scam_score,
                        "detected_flags": flags,
                        "risk_level": (
                            "CRÍTICO" if total_risk > 70
                            else "ALTO" if total_risk > 40
                            else "BAJO"
                        ),
                    })

        return results


# ── Prueba standalone con mock data ─────────────────────────────────────────
if __name__ == "__main__":
    detector = BotDetector(threshold=0.85)

    sample_posts = [
        {
            "user": "@alpha_bot_1",
            "text": "¡Increíble oportunidad! Gana dinero rápido aquí: bit.ly/spam",
            "metadata": {"created_at": "2026-02-15", "followers": 2, "is_default_pfp": True}
        },
        {
            "user": "@alpha_bot_2",
            "text": "¡Increíble oportunidad! Gana dinero rápido ahora: bit.ly/spam",
            "metadata": {"created_at": "2026-02-20", "followers": 0, "is_default_pfp": True}
        },
        {
            "user": "@usuario_real",
            "text": "Me encanta el clima hoy en la Amazonía.",
            "metadata": {"created_at": "2021-05-10", "followers": 450, "is_default_pfp": False}
        }
    ]

    findings = detector.run_detection(sample_posts)
    print("=== REPORTE DE HALLAZGOS ===")
    print(json.dumps(findings, indent=2, ensure_ascii=False))
