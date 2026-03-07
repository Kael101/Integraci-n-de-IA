"""
keyword_engine.py — Motor de filtrado de palabras clave para detección de estafas.

Calcula un "Scam Score" (0–100) analizando el contenido del texto en busca
de indicadores de riesgo predefinidos (red flags).

Uso:
    from keyword_engine import ScamFilter
    sf = ScamFilter()
    score, flags = sf.analyze_text("¡Gana dinero con cripto! Escríbeme por WhatsApp")
"""


class ScamFilter:
    def __init__(self):
        # Diccionario de palabras sospechosas y su peso en el riesgo
        self.red_flags = {
            "whatsapp": 20,
            "escríbeme": 15,
            "inversión": 25,
            "ganancia": 25,
            "dinero": 20,
            "cripto": 30,
            "oportunidad": 15,
            "bit.ly": 30,
            "t.me": 30,   # Enlaces a Telegram
            "regalo": 20,
        }

    def analyze_text(self, text: str) -> tuple[int, list[str]]:
        """
        Analiza el texto y retorna un puntaje de riesgo de 0 a 100,
        junto con la lista de palabras clave detectadas.

        Args:
            text: Contenido del post o mensaje a analizar.

        Returns:
            (score, found_keywords)
                score          – Entero entre 0 y 100.
                found_keywords – Lista de red flags detectadas.
        """
        score = 0
        text_lower = text.lower()
        found_keywords = []

        for word, weight in self.red_flags.items():
            if word in text_lower:
                score += weight
                found_keywords.append(word)

        # Normalizamos el score a un máximo de 100
        return min(score, 100), found_keywords
