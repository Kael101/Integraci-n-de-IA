"""
get_session.py — Extractor de sesión (ejecutar UNA sola vez de forma manual).

Instrucciones:
  1. Corre este script: C:\Python312\python.exe get_session.py
  2. Se abrirá Chrome en modo visible. Inicia sesión manualmente (usuario + 2FA si aplica).
  3. Tienes 2 minutos. Después, el script guarda 'facebook_session.json' y cierra.
  4. A partir de ese momento, el bot usará ese archivo — sin tocar el formulario de login.

ADVERTENCIA: facebook_session.json contiene tus credenciales de sesión.
Nunca lo subas a un repositorio público. Ya está en el .gitignore.
"""

import asyncio
from playwright.async_api import async_playwright


async def save_session():
    async with async_playwright() as p:
        # headless=False para que puedas interactuar manualmente
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/119.0.0.0 Safari/537.36"
            )
        )
        page = await context.new_page()

        print("=" * 50)
        print("[!] Abriendo Facebook Login...")
        print("[!] Tienes 2 minutos para iniciar sesión (incluyendo 2FA si aplica).")
        print("=" * 50)

        await page.goto("https://www.facebook.com/login")

        # Esperar hasta 2 minutos para el login manual
        await page.wait_for_timeout(120_000)

        # Guardar cookies + localStorage en JSON
        await context.storage_state(path="facebook_session.json")
        print("\n[+] ✅ Sesión guardada en 'facebook_session.json'")
        print("[+] Ya puedes correr scraper_engine.py o run_app.py con sesión activa.")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(save_session())
