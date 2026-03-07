"""
scraper_engine.py — Motor de scraping sigiloso con captura de evidencia visual.

Clases:
  - SocialScraper   : Scraper sin sesión (contenido público, lectura básica)
  - StealthScraper  : Scraper con cookies + screenshot de evidencia (Facebook/Instagram)

SEGURIDAD:
  - Usa siempre el mismo User-Agent que get_session.py para no invalidar la sesión.
  - No superes 10-15 perfiles/hora para imitar comportamiento humano.
  - Usa una cuenta "sock puppet", nunca tu cuenta personal.
"""

import asyncio
import os
from datetime import datetime
from playwright.async_api import async_playwright

# ── User-Agent compartido (idéntico en get_session.py) ────────────────────────
_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/119.0.0.0 Safari/537.36"
)


# ══════════════════════════════════════════════════════════════════════════════
# SocialScraper  —  Sin autenticación (posts públicos)
# ══════════════════════════════════════════════════════════════════════════════
class SocialScraper:
    """Scraper básico sin sesión. Útil para contenido público de Instagram."""

    def __init__(self):
        self.user_agent = _USER_AGENT

    async def fetch_comments(self, url: str, platform: str = "instagram") -> list:
        """Extrae comentarios de una URL pública. Devuelve lista compatible con BotDetector."""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=self.user_agent)
            page = await context.new_page()

            print(f"[*] Accediendo a {platform}: {url}...")
            await page.goto(url)
            await page.wait_for_timeout(3000)

            posts_data = []

            if platform == "instagram":
                comments = await page.query_selector_all('ul._a9z6 li')
                for comment in comments[:10]:
                    text = await comment.inner_text()
                    posts_data.append({
                        "user": "Hidden_User",
                        "text": text,
                        "metadata": {
                            "created_at": "2026-03-03",
                            "followers": 0,
                            "is_default_pfp": False
                        }
                    })

            await browser.close()
            print(f"[+] Extraídos {len(posts_data)} comentario(s).")
            return posts_data


# ══════════════════════════════════════════════════════════════════════════════
# StealthScraper  —  Con cookies + captura de pantalla de evidencia
# ══════════════════════════════════════════════════════════════════════════════
class StealthScraper:
    """
    Scraper avanzado que:
      1. Carga una sesión guardada por get_session.py (sin login visible)
      2. Toma una captura full-page como evidencia visual
      3. Extrae posts/comentarios y los devuelve junto a la ruta del screenshot
    """

    def __init__(self, session_file: str = "facebook_session.json"):
        self.session_file = session_file
        self.user_agent = _USER_AGENT

    async def run_safe_scan(self, target_url: str, platform: str = "facebook"):
        """
        Navega al objetivo con la sesión guardada, captura screenshot y extrae datos.

        Returns:
            (raw_posts, screenshot_path) — ambos None si hay error de sesión.
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            # ── Cargar sesión (cookies + localStorage) ──────────────────────
            try:
                context = await browser.new_context(
                    storage_state=self.session_file,
                    user_agent=self.user_agent
                )
                print(f"[+] Sesión cargada desde '{self.session_file}'")
            except FileNotFoundError:
                print(f"[!] No se encontró '{self.session_file}'.")
                print("[!] Primero corre: C:\\Python312\\python.exe get_session.py")
                await browser.close()
                return None, None
            except Exception as e:
                print(f"[!] Error de sesión: {e}")
                await browser.close()
                return None, None

            page = await context.new_page()
            page.set_default_timeout(60_000)  # 60s por si la red está lenta

            await page.goto(target_url, wait_until="networkidle")
            await page.wait_for_timeout(5000)  # Espera extra para renderizado JS

            # ── Captura de pantalla como evidencia ──────────────────────────
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_path = f"evidencia_{platform}_{timestamp}.png"

            print(f"[*] Capturando evidencia visual → {screenshot_path}...")
            await page.screenshot(path=screenshot_path, full_page=True)

            # ── Extracción de datos ─────────────────────────────────────────
            raw_posts = []
            if platform == "facebook":
                # Selector genérico para artículos/comentarios de Facebook
                elements = await page.query_selector_all('div[role="article"]')
                for el in elements[:10]:
                    text = await el.inner_text()
                    if text:
                        raw_posts.append({
                            "user": "Usuario_Analizado",
                            "text": text.strip(),
                            "metadata": {
                                "created_at": "2026-03-03",
                                "followers": 1,
                                "is_default_pfp": True
                            }
                        })

            await browser.close()
            print(f"[+] Extraídos {len(raw_posts)} post(s) | Evidencia: {screenshot_path}")
            # Devolvemos AMBOS: datos y ruta de imagen
            return raw_posts, screenshot_path


# ── Prueba rápida ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    scraper = StealthScraper()
    asyncio.run(
        scraper.run_safe_scan(
            "https://www.facebook.com/zuck/posts/10115016599292811",
            platform="facebook"
        )
    )
