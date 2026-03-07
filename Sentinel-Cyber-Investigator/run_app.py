r"""
run_app.py — Orquestador principal del Sentinel Cyber Investigator.

Flujo completo de una misión:
  [StealthScraper]  →  raw_posts + outputs/screenshots/evidencia_*.png
        ↓
  [BotDetector]     →  lista de coincidencias sospechosas
        ↓
  [EvidenceReport]  →  outputs/reports/Informe_Sentinel_*.pdf

Uso:
    1. Edita TARGET_URL con el post a investigar.
    2. C:\Python312\python.exe run_app.py
"""

import asyncio
import os
from scraper_engine import StealthScraper
from main_detector import BotDetector
from report_generator import EvidenceReport


async def main_mission(url: str, platform: str = "facebook"):
    print(f"\n{'='*55}")
    print(f"  🕵️  SENTINEL CYBER INVESTIGATOR — MISIÓN EN CURSO")
    print(f"{'='*55}")
    print(f"[*] Plataforma  : {platform.upper()}")
    print(f"[*] Objetivo    : {url}\n")

    # ── 1. SCRAPEO SIGILOSO ────────────────────────────────────────────────────
    # La sesión se carga desde auth/facebook_session.json automáticamente
    scraper = StealthScraper()
    raw_data, screenshot_file = await scraper.run_safe_scan(url, platform=platform)

    if not raw_data:
        print("[!] Recolección de datos fallida. Misión abortada.")
        print("[!] Asegúrate de haber corrido get_session.py primero.")
        return

    print(f"\n[+] Posts recolectados : {len(raw_data)}")
    print(f"[+] Evidencia visual   : {screenshot_file}\n")

    # ── 2. ANÁLISIS TÉCNICO DE BOTS ────────────────────────────────────────────
    print("[*] Ejecutando motor de detección de similitud...")
    detector = BotDetector(threshold=0.85)
    findings = detector.run_detection(raw_data)
    print(f"[+] Coincidencias detectadas: {len(findings)}\n")

    # ── 3. GENERACIÓN DEL REPORTE PDF ─────────────────────────────────────────
    # El PDF se guarda en outputs/reports/ automáticamente
    print("[*] Generando informe PDF...")
    pdf = EvidenceReport()
    pdf_path = pdf.create_report(findings, screenshot_path=screenshot_file)

    print(f"\n{'='*55}")
    print(f"✅  MISIÓN FINALIZADA")
    print(f"    Screenshot → {screenshot_file}")
    print(f"    PDF        → {pdf_path}")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    # ── CONFIGURACIÓN DE MISIÓN ────────────────────────────────────────────────
    TARGET_URL      = "https://www.facebook.com/zuck/posts/10115016599292811"
    TARGET_PLATFORM = "facebook"   # "facebook" | "instagram"

    asyncio.run(main_mission(TARGET_URL, TARGET_PLATFORM))
