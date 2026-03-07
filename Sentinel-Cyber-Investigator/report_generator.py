r"""
report_generator.py — Generador de informes técnicos de inteligencia de amenazas.

PDFs se guardan en outputs/reports/.

Uso standalone:
    C:\Python312\python.exe report_generator.py

Uso integrado:
    from report_generator import EvidenceReport
    pdf = EvidenceReport()
    pdf.create_report(findings, screenshot_path="...", output_filename="...")
"""

import os
from fpdf import FPDF
from datetime import datetime

# ── Ruta canónica para reportes ───────────────────────────────────────────────
_BASE_DIR    = os.path.dirname(__file__)
_REPORTS_DIR = os.path.join(_BASE_DIR, "outputs", "reports")


class EvidenceReport(FPDF):

    def header(self):
        self.set_font("Arial", "B", 15)
        self.cell(0, 10, "INFORME TÉCNICO DE INTELIGENCIA DE AMENAZAS", 0, 1, "C")
        self.set_font("Arial", "I", 10)
        self.cell(0, 10, f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 0, 1, "R")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(
            0, 10,
            f"Confidencial - Sentinel Bot Detector - Página {self.page_no()}",
            0, 0, "C"
        )

    def create_report(
        self,
        findings: list,
        screenshot_path: str = None,
        output_filename: str = None
    ):
        """
        Genera el PDF con 3 secciones: Resumen, Evidencia Visual, Análisis Técnico.
        Si output_filename es None, el PDF se guarda en outputs/reports/ automáticamente.
        """
        os.makedirs(_REPORTS_DIR, exist_ok=True)

        if output_filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = os.path.join(_REPORTS_DIR, f"Informe_Sentinel_{timestamp}.pdf")
        elif not os.path.isabs(output_filename):
            output_filename = os.path.join(_REPORTS_DIR, output_filename)

        self.add_page()
        self.set_font("Arial", "", 12)

        # ── 1. Resumen Ejecutivo ──────────────────────────────────────────────
        self.set_font("Arial", "B", 13)
        self.cell(0, 10, "1. RESUMEN EJECUTIVO", 0, 1)
        self.set_font("Arial", "", 11)

        if not findings:
            self.multi_cell(0, 10,
                "No se detectó actividad coordinada inusual en la muestra analizada.")
        else:
            self.set_text_color(200, 0, 0)
            self.multi_cell(0, 10,
                f"ALERTA: Se han identificado {len(findings)} patrón(es) de comportamiento "
                f"coordinado compatibles con actividad automatizada (botnet).")
            self.set_text_color(0, 0, 0)

        self.ln(5)

        # ── 2. Evidencia Visual ───────────────────────────────────────────────
        if screenshot_path and os.path.exists(screenshot_path):
            self.set_font("Arial", "B", 13)
            self.cell(0, 10, "2. EVIDENCIA VISUAL (CAPTURA DE PANTALLA)", 0, 1)
            self.ln(2)
            print(f"[*] Insertando captura en PDF: {screenshot_path}")
            try:
                self.image(screenshot_path, w=170)
            except Exception as e:
                self.set_text_color(255, 0, 0)
                self.cell(0, 10, f"Error al insertar imagen: {e}", 0, 1)
                self.set_text_color(0, 0, 0)
            self.ln(10)
            self.add_page()

        # ── 3. Análisis Técnico ───────────────────────────────────────────────
        self.set_font("Arial", "B", 13)
        self.cell(0, 10, "3. ANÁLISIS TÉCNICO DE COINCIDENCIAS", 0, 1)
        self.ln(5)

        if findings:
            for i, item in enumerate(findings):
                self.set_font("Arial", "B", 11)
                self.cell(
                    0, 10,
                    f"Caso #{i + 1}: Similitud {item['similarity'] * 100:.1f}%",
                    border=1, ln=1
                )
                self.set_font("Arial", "", 10)
                clean = item["content_sample"].encode("ascii", "ignore").decode("ascii")
                self.multi_cell(0, 7, (
                    f"Usuarios implicados          : {', '.join(item['users'])}\n"
                    f"Nivel de Riesgo Estimado     : {item['risk_level']}\n"
                    f"Muestra de texto (100 chars) : {clean}\n"
                ))
                self.ln(3)
        else:
            self.set_font("Arial", "", 11)
            self.cell(0, 10, "Sin coincidencias detectadas.", 0, 1)

        self.output(output_filename)
        print(f"[+] ✅ Reporte guardado en: '{output_filename}'")
        return output_filename


# ── Prueba standalone ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_findings = [{
        "users": ["@bot1", "@bot2"],
        "similarity": 0.98,
        "content_sample": "Oferta increible, compra ya!",
        "risk_level": "ALTO"
    }]

    test_img = None
    try:
        from PIL import Image
        test_img = os.path.join(_BASE_DIR, "outputs", "screenshots", "test.png")
        os.makedirs(os.path.dirname(test_img), exist_ok=True)
        Image.new("RGB", (400, 200), color=(220, 50, 50)).save(test_img)
        print(f"[*] Imagen de prueba creada: {test_img}")
    except ImportError:
        print("[!] Pillow no disponible — PDF sin imagen de prueba.")

    pdf = EvidenceReport()
    pdf.create_report(test_findings, screenshot_path=test_img)
