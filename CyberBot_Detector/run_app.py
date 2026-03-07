"""
run_app.py — Orquestador principal del CyberBot Detector.

Flujo completo:
  [StealthScraper] → datos + screenshot.png
        ↓
  [BotDetector]   → hallazgos de similitud
        ↓
  [EvidenceReport] → PDF con imagen embebida

Uso:
    C:\Python312\python.exe run_app.py
"""

import asyncio
import os
from scraper_engine import StealthScraper
from main_detector import BotDetector
from report_generator import EvidenceReport


async def main_mission(url: str, platform: str = "facebook"):
    print(f"\n{'='*52}")
    print(f"  🕵️  SENTINEL BOT DETECTOR — MISIÓN EN CURSO")
    print(f"{'='*52}")
    print(f"[*] Plataforma : {platform.upper()}")
    print(f"[*] Objetivo   : {url}\n")

    # ── 1. SCRAPEO SIGILOSO con cookies + screenshot ──────────────────────────
    scraper = StealthScraper(session_file="facebook_session.json")
    raw_data, screenshot_file = await scraper.run_safe_scan(url, platform=platform)

    if not raw_data:
        print("[!] La recolección de datos falló. Misión abortada.")
        return

    print(f"[+] Posts recolectados  : {len(raw_data)}")
    print(f"[+] Evidencia visual    : {screenshot_file}\n")

    # ── 2. ANÁLISIS TÉCNICO DE BOTS ───────────────────────────────────────────
    print("[*] Ejecutando motor de detección de similitud...")
    detector = BotDetector(threshold=0.85)
    findings = detector.run_detection(raw_data)
    print(f"[+] Coincidencias detectadas: {len(findings)}\n")

    # ── 3. GENERACIÓN DEL REPORTE PDF ─────────────────────────────────────────
    print("[*] Generando informe PDF con evidencia embebida...")
    base_name = os.path.basename(screenshot_file).replace(".png", ".pdf") if screenshot_file else "reporte.pdf"
    final_pdf_name = f"Informe_Sentinel_{base_name}"

    pdf = EvidenceReport()
    pdf.create_report(
        findings,
        screenshot_path=screenshot_file,
        output_filename=final_pdf_name
    )

    print(f"\n{'='*52}")
    print(f"✅  MISIÓN FINALIZADA")
    print(f"    PDF → {final_pdf_name}")
    print(f"{'='*52}\n")


if __name__ == "__main__":
    TARGET_URL = "https://www.facebook.com/zuck/posts/10115016599292811"
    TARGET_PLATFORM = "facebook"   # "facebook" | "instagram"
    asyncio.run(main_mission(TARGET_URL, TARGET_PLATFORM))
