r"""
report_generator.py — Generador de informes técnicos de inteligencia de amenazas.

Ahora con soporte para insertar capturas de pantalla como evidencia visual.

Uso standalone:
    C:\Python312\python.exe report_generator.py

Uso integrado:
    from report_generator import EvidenceReport
    pdf = EvidenceReport()
    pdf.create_report(findings, screenshot_path="evidencia.png", output_filename="Informe.pdf")
"""

import os
from fpdf import FPDF
from datetime import datetime


class EvidenceReport(FPDF):

    def header(self):
        """Encabezado que aparece en todas las páginas."""
        self.set_font("Arial", "B", 15)
        self.cell(0, 10, "INFORME TÉCNICO DE INTELIGENCIA DE AMENAZAS", 0, 1, "C")
        self.set_font("Arial", "I", 10)
        self.cell(0, 10, f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 0, 1, "R")
        self.ln(10)

    def footer(self):
        """Pie de página con número y etiqueta de confidencialidad."""
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
        output_filename: str = "reporte_final.pdf"
    ):
        """
        Genera el PDF con resumen ejecutivo, evidencia visual y análisis técnico.

        Args:
            findings        : Lista de dicts de BotDetector.run_detection()
            screenshot_path : Ruta al PNG de evidencia (opcional)
            output_filename : Nombre/ruta del PDF de salida
        """
        self.add_page()
        self.set_font("Arial", "", 12)

        # ── 1. Resumen Ejecutivo ──────────────────────────────────────────────
        self.set_font("Arial", "B", 13)
        self.cell(0, 10, "1. RESUMEN EJECUTIVO", 0, 1)
        self.set_font("Arial", "", 11)

        if not findings:
            self.multi_cell(
                0, 10,
                "No se detectó actividad coordinada inusual en la muestra analizada."
            )
        else:
            self.set_text_color(200, 0, 0)  # Rojo alerta
            self.multi_cell(
                0, 10,
                f"ALERTA: Se han identificado {len(findings)} patrón(es) de comportamiento "
                f"coordinado compatibles con actividad automatizada (botnet)."
            )
            self.set_text_color(0, 0, 0)

        self.ln(5)

        # ── 2. Evidencia Visual (screenshot) ─────────────────────────────────
        if screenshot_path and os.path.exists(screenshot_path):
            self.set_font("Arial", "B", 13)
            self.cell(0, 10, "2. EVIDENCIA VISUAL (CAPTURA DE PANTALLA)", 0, 1)
            self.ln(2)

            print(f"[*] Insertando captura '{screenshot_path}' en el PDF...")
            try:
                # w=170 deja márgenes decentes en A4; alto se ajusta automáticamente
                self.image(screenshot_path, w=170)
            except Exception as e:
                self.set_text_color(255, 0, 0)
                self.cell(0, 10, f"Error al insertar imagen: {e}", 0, 1)
                self.set_text_color(0, 0, 0)

            self.ln(10)
            self.add_page()  # Nueva página para el análisis técnico

        # ── 3. Análisis Técnico de Coincidencias ─────────────────────────────
        self.set_font("Arial", "B", 13)
        self.cell(0, 10, "3. ANÁLISIS TÉCNICO DE COINCIDENCIAS", 0, 1)
        self.ln(5)

        if findings:
            for i, item in enumerate(findings):
                self.set_font("Arial", "B", 11)
                self.cell(
                    0, 10,
                    f"Caso #{i + 1}: Similitud de Texto {item['similarity'] * 100:.1f}%",
                    border=1, ln=1
                )
                self.set_font("Arial", "", 10)

                # Sanitizar texto para evitar errores de codificación en PDF
                clean_sample = item['content_sample'].encode('ascii', 'ignore').decode('ascii')

                content = (
                    f"Usuarios implicados           : {', '.join(item['users'])}\n"
                    f"Nivel de Riesgo Estimado      : {item['risk_level']}\n"
                    f"Muestra de texto (100 chars)  : {clean_sample}\n"
                )
                self.multi_cell(0, 7, content)
                self.ln(3)
        else:
            self.set_font("Arial", "", 11)
            self.cell(0, 10, "Sin coincidencias detectadas.", 0, 1)

        self.output(output_filename)
        print(f"[+] ✅ Reporte PDF generado: '{output_filename}'")

        # Descomenta para borrar el PNG después de insertarlo:
        # if screenshot_path and os.path.exists(screenshot_path):
        #     os.remove(screenshot_path)
        #     print(f"[*] Imagen temporal '{screenshot_path}' eliminada.")


# ── Prueba standalone ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_findings = [
        {
            "users": ["@bot1", "@bot2"],
            "similarity": 0.98,
            "content_sample": "Oferta increible, compra ya!",
            "risk_level": "ALTO"
        }
    ]

    # Crear imagen de prueba si no existe
    test_img = "test.png"
    if not os.path.exists(test_img):
        try:
            from PIL import Image
            img = Image.new("RGB", (400, 200), color=(220, 50, 50))
            img.save(test_img)
            print(f"[*] Imagen de prueba '{test_img}' creada.")
        except ImportError:
            print("[!] Pillow no instalado. El PDF se generará sin imagen de prueba.")
            test_img = None

    pdf = EvidenceReport()
    pdf.create_report(
        test_findings,
        screenshot_path=test_img,
        output_filename="test_reporte.pdf"
    )
