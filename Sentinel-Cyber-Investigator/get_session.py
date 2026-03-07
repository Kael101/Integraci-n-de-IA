"""
get_session.py — Extractor de sesión (ejecutar UNA sola vez de forma manual).

Instrucciones:
  1. Corre: C:\Python312\python.exe get_session.py
  2. Se abrirá Chrome visible. Inicia sesión + completa 2FA si aplica.
  3. Navega unos minutos como usuario real para "calentar" la sesión.
  4. El script espera 2 minutos y luego guarda la sesión en auth/facebook_session.json.

ADVERTENCIA: auth/facebook_session.json contiene credenciales activas.
Nunca lo subas a un repositorio público. Ya está en el .gitignore.
"""

import asyncio
import os
from playwright.async_api import async_playwright

# ── Ruta canónica del archivo de sesión ──────────────────────────────────────
AUTH_DIR = os.path.join(os.path.dirname(__file__), "auth")
SESSION_FILE = os.path.join(AUTH_DIR, "facebook_session.json")

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/119.0.0.0 Safari/537.36"
)


async def save_session():
    os.makedirs(AUTH_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # visible para login manual
        context = await browser.new_context(user_agent=_USER_AGENT)
        page = await context.new_page()

        print("=" * 55)
        print("[!] Abriendo Facebook Login en el navegador...")
        print("[!] Tienes 2 minutos: inicia sesión + completa 2FA.")
        print("[!] Navega un poco antes de cerrar para calentar la sesión.")
        print("=" * 55)

        await page.goto("https://www.facebook.com/login")
        await page.wait_for_timeout(120_000)  # 2 minutos de ventana manual

        await context.storage_state(path=SESSION_FILE)
        print(f"\n[+] ✅ Sesión guardada en '{SESSION_FILE}'")
        print("[+] Ya puedes correr run_app.py con sesión activa.")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(save_session())
