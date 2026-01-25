# ESPECIFICACIONES TÉCNICAS: MÓDULO SOS JAGUAR (OFFLINE CRITICAL)

## 1. Objetivo
Proveer asistencia inmediata al usuario en situaciones de peligro, con o sin conexión a internet.

## 2. UI/UX (Modo Pánico)
- **Componente:** `SosOverlay.jsx`.
- **Estilo:** Fondo Rojo Sólido (`bg-red-600`), Texto Blanco Gigante, Alto Contraste. Eliminar transparencias.
- **Acción:** Deslizar botón para confirmar emergencia (evitar toques accidentales).

## 3. Lógica de "Grito Digital" (Cascade Fallback)
Al activar SOS, el sistema debe ejecutar en paralelo:
1.  **Captura GPS:** Obtener latitud/longitud con máxima precisión (`enableHighAccuracy: true`).
2.  **Intento API:** Intentar enviar POST a `/api/emergency` (si hay datos).
3.  **Fallback SMS (Nativo):** Abrir el intent de SMS nativo del teléfono pre-llenado con:
    * "SOS [Nombre] necesita ayuda. Ubicación: https://maps.google.com/?q=[lat],[long]. Batería: [X]%".
    * Destinatarios: Números de emergencia locales + Contactos de confianza del usuario.
4.  **Fallback WhatsApp:** Generar enlace `wa.me` pre-llenado con el mismo mensaje.

## 4. Guía de Primeros Auxilios Offline (Static JSON)
- La app debe contener un archivo `first_aid_guide.json` (descargado en la instalación) con instrucciones simples para:
    - Mordedura de serpiente (Protocolo local).
    - Esguinces/Fracturas.
    - Deshidratación.
- **UI:** Tarjetas grandes, texto corto, iconos claros. NO videos (pesados).

## 5. Integración con SyncService
- Guardar el estado `IS_IN_EMERGENCY = true` en LocalStorage.
- Si el teléfono se apaga y se prende, la app debe abrirse directamente en modo SOS hasta que el usuario lo cancele con un PIN.
