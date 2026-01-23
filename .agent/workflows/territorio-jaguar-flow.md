---
description: Lógica de interacción y orquestación para los agentes de Territorio Jaguar.
---

# Flujo Multi-Agente: Territorio Jaguar

Este documento define la arquitectura y el comportamiento de los agentes de IA dentro del ecosistema de Territorio Jaguar.

## 1. Agentes y Roles

### Agente Orquestador (Central)
- **Rol**: Cerebro estratégico y punto de entrada.
- **System Prompt**: "Eres el cerebro de Territorio Jaguar. Tu función es recibir consultas de turistas y delegar a los agentes especialistas. Siempre verifica primero la seguridad con el Agente de Guías antes de sugerir un tour."
- **Responsabilidad**: Coordinar el flujo entre Guías, Maps y Artesanos.

### Agente B (Broker Turístico)
- **Rol**: Especialista en infraestructura y recomendaciones comerciales.
- **Servidor MCP**: `google-maps` (Official SDK).
- **Mapeo de Herramientas**:
    *   `Maps_search` -> `google_maps_search`
    *   `Maps_routing` -> `google_maps_directions`
    *   `Maps_place_details` -> `google_maps_place_details`
- **Lógica**: "Cuando un usuario pida recomendaciones de hospedaje o comida, usa la herramienta `google_maps_search`. Filtra los resultados por aquellos que tengan una calificación mayor a 4.0 según `google_maps_reviews` (si está disponible)."

### Agentes Locales (Territorio Jaguar)
- **Agente de Guías (IA del Upano)**: Gestiona actividad de jaguares y seguridad en campo.
- **Agente de Artesanos**: Gestiona inventario y disponibilidad de talleres locales.

## 2. Protocolo de Operación (Script de Prueba)

Para una consulta como: *"Quiero ver un jaguar mañana y comer en un lugar que acepte tarjeta en Macas"*, el flujo debe ser:

1. **Consulta de Seguridad/Actividad**: Llamar al Agente de Guías (vía MCP local) -> Determinar sector de actividad (ej: "Sector Abanico").
2. **Búsqueda Geográfica**: Llamar al Agente B (Google Maps MCP) -> `Maps_search(query="restaurantes tarjeta", location="Macas")`.
3. **Logística**: Agente B -> `Maps_routing(origin="Sector Abanico", destination="Restaurante X")`.
4. **Valor Agregado**: Agente de Artesanos -> Buscar talleres abiertos cerca del destino.
5. **Consolidación**: El Orquestador presenta la oferta completa al turista.

## 3. Restricciones Críticas

- **Soberanía de Datos**: **PROHIBIDO** enviar coordenadas GPS exactas de jaguares a APIs externas (Google Maps). Usar únicamente nombres de sectores generales para el cálculo de rutas.
- **Offline Cache Protocol**: 
    1. Antes de cada llamada externa, consultar `src/services/mcpCache.js` mediante el Agente B.
    2. Si hay un `hit`, usar el dato y avisar al usuario: *"Usando datos en caché por baja señal."*
    3. Si hay un `miss` y no hay conexión, activar el Fallback de base de datos local.
- **Fallbacks**: Si el servidor MCP falla, recurre a la base de datos local y notificar: *"Actuando en Modo Offline: Mostrando datos guardados; la información en tiempo real no está disponible."*
