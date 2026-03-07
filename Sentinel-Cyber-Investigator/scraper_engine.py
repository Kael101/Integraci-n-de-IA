r"""
scraper_engine.py — Motor de scraping sigiloso con captura de evidencia visual.

Clases:
  - SocialScraper   : Sin sesión (contenido público)
  - StealthScraper  : Con cookies de sesión + screenshot a outputs/screenshots/

SEGURIDAD:
  - Mismo User-Agent que get_session.py para no invalidar la sesión.
  - Mantén rate-limit: máx 10-15 perfiles por hora.
  - Usa cuenta "sock puppet", nunca tu cuenta personal.
"""

import asyncio
import os
from datetime import datetime
from playwright.async_api import async_playwright

# ── Rutas canónicas del proyecto ─────────────────────────────────────────────
_BASE_DIR        = os.path.dirname(__file__)
_AUTH_DIR        = os.path.join(_BASE_DIR, "auth")
_SCREENSHOTS_DIR = os.path.join(_BASE_DIR, "outputs", "screenshots")

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
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent=self.user_agent)
            page = await context.new_page()

            print(f"[*] Accediendo a {platform}: {url}...")
            await page.goto(url)
            await page.wait_for_timeout(3000)

            posts_data = []
            if platform == "instagram":
                comments = await page.query_selector_all("ul._a9z6 li")
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
# StealthScraper  —  Con cookies + screenshot a outputs/screenshots/
# ══════════════════════════════════════════════════════════════════════════════
class StealthScraper:
    """
    Scraper avanzado que:
      1. Carga sesión guardada por get_session.py (sin formulario de login)
      2. Toma captura full-page → outputs/screenshots/evidencia_PLATFORM_TIMESTAMP.png
      3. Extrae posts — devuelve (raw_posts, screenshot_path)
    """

    def __init__(self, session_file: str = None):
        self.session_file = session_file or os.path.join(_AUTH_DIR, "facebook_session.json")

    async def run_safe_scan(self, target_url: str, platform: str = "facebook"):
        """
        Returns:
            (raw_posts list, screenshot_path str) — ambos None si hay error de sesión.
        """
        os.makedirs(_SCREENSHOTS_DIR, exist_ok=True)

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            # ── Cargar sesión guardada ───────────────────────────────────────
            try:
                context = await browser.new_context(
                    storage_state=self.session_file,
                    user_agent=_USER_AGENT
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
            page.set_default_timeout(60_000)

            await page.goto(target_url, wait_until="networkidle")
            await page.wait_for_timeout(5000)

            # ── Captura de pantalla → outputs/screenshots/ ──────────────────
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_filename = f"evidencia_{platform}_{timestamp}.png"
            screenshot_path = os.path.join(_SCREENSHOTS_DIR, screenshot_filename)

            print(f"[*] Capturando evidencia visual → {screenshot_path}...")
            await page.screenshot(path=screenshot_path, full_page=True)

            # ── Extracción de posts ──────────────────────────────────────────
            raw_posts = []
            if platform == "facebook":
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
            print(f"[+] Posts: {len(raw_posts)} | Screenshot: {screenshot_path}")
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
