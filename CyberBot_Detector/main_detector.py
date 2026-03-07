import difflib
import json
from datetime import datetime


class BotDetector:
    def __init__(self, threshold=0.8):
        # El umbral (threshold) define qué tan similares deben ser dos textos
        # para considerarlos "copypasta". 0.8 = 80% de similitud.
        self.threshold = threshold
        self.suspect_database = []

    def calculate_similarity(self, text1, text2):
        """Calcula el ratio de similitud entre dos mensajes."""
        return difflib.SequenceMatcher(None, text1, text2).ratio()

    def analyze_account_metadata(self, account_data):
        """
        Analiza si el perfil cumple con 'red flags' de automatización.
        account_data: dict con {'username', 'created_at', 'followers', 'is_default_pfp'}
        """
        score = 0
        # Regla 1: Cuenta nueva (menos de 3 meses)
        days_old = (datetime.now() - datetime.strptime(account_data['created_at'], "%Y-%m-%d")).days
        if days_old < 90:
            score += 30

        # Regla 2: Sin seguidores pero mucha actividad
        if account_data['followers'] < 10:
            score += 40

        # Regla 3: Foto de perfil por defecto
        if account_data.get('is_default_pfp'):
            score += 20

        return score

    def run_detection(self, post_batch):
        """
        Procesa un lote de posts para encontrar patrones.
        post_batch: lista de diccionarios con {'user', 'text', 'metadata'}
        """
        results = []

        for i, post1 in enumerate(post_batch):
            for j, post2 in enumerate(post_batch):
                if i >= j:
                    continue  # Evitar duplicados y comparar consigo mismo

                similarity = self.calculate_similarity(post1['text'], post2['text'])

                if similarity > self.threshold:
                    risk_score = self.analyze_account_metadata(post1['metadata'])
                    results.append({
                        "users": [post1['user'], post2['user']],
                        "similarity": round(similarity, 2),
                        "content_sample": post1['text'][:50] + "...",
                        "risk_level": "ALTO" if risk_score > 60 else "MEDIO"
                    })

        return results


# --- ÁREA DE PRUEBA (MOCK DATA) ---
if __name__ == "__main__":
    detector = BotDetector(threshold=0.85)

    # Datos de ejemplo para probar la lógica sin consumir APIs aún
    sample_posts = [
        {
            "user": "@alpha_bot_1",
            "text": "¡Increíble oportunidad! Gana dinero rápido aquí: bit.ly/spam",
            "metadata": {
                "created_at": "2026-02-15",
                "followers": 2,
                "is_default_pfp": True
            }
        },
        {
            "user": "@alpha_bot_2",
            "text": "¡Increíble oportunidad! Gana dinero rápido ahora: bit.ly/spam",
            "metadata": {
                "created_at": "2026-02-20",
                "followers": 0,
                "is_default_pfp": True
            }
        },
        {
            "user": "@usuario_real",
            "text": "Me encanta el clima hoy en la Amazonía.",
            "metadata": {
                "created_at": "2021-05-10",
                "followers": 450,
                "is_default_pfp": False
            }
        }
    ]

    findings = detector.run_detection(sample_posts)
    print("=== REPORTE DE HALLAZGOS ===")
    print(json.dumps(findings, indent=2, ensure_ascii=False))
