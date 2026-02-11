# Esquema de la Base de Datos Firebase - Territorio Jaguar

Este documento describe la organización actual de las colecciones en Firestore, basada en el análisis del código fuente.

## Colecciones Principales

### 1. `socios` (Socios / Proveedores)
Almacena la información de los comercios y emprendimientos afiliados.

**Campos Identificados:**
- `name` (string): Nombre del establecimiento.
- `category` (string): Categoría del negocio (ej. "Gastronomía", "Artesanía").
- `thumbnail` (string): URL de la imagen principal.
- `rating` (number): Calificación promedio (ej. 4.5).
- `coordinates` (map): Ubicación geográfica.
  - `lng` (number): Longitud.
  - `lat` (number): Latitud.
- `createdAt` (timestamp string): Fecha de creación del registro.

**Referencia en código:** `src/services/firestoreService.js`, `src/utils/migrateToFirestore.js`

---

### 2. `rutas` (Rutas Turísticas)
Información sobre los senderos y recorridos disponibles.

**Campos Identificados:**
- `name` (string): Nombre de la ruta.
- `difficulty` (string): Nivel de dificultad (ej. "Media").
- `duration` (string): Duración estimada (ej. "3 horas").
- `distance` (string): Distancia total (ej. "5 km").
- `description` (string): Descripción detallada.
- `geometry` (map/object): Geometría de la ruta (probablemente GeoJSON LineString).
- `createdAt` (timestamp string): Fecha de creación.

**Referencia en código:** `src/services/firestoreService.js`, `src/utils/migrateToFirestore.js`

---

### 3. `productos` (Marketplace)
Catálogo de productos vendidos por los socios.

**Campos Identificados:**
- `name` (string): Nombre del producto.
- `producer` (string): Nombre del productor o asociación.
- `category` (string): Categoría del producto.
- `price` (number): Precio unitario.
- `rating` (number): Calificación del producto.
- `image` (string): URL de la imagen del producto.
- `isNew` (boolean): Indicador de novedad.
- `tag` (string, opcional): Etiqueta especial (ej. "Superalimento").
- `stock` (number, opcional): Cantidad disponible.
- `createdAt` (timestamp string): Fecha de creación.

**Referencia en código:** `src/services/firestoreService.js`, `src/agents/biocommerceAgent.js`

---

### 4. `detecciones_ia` (Detecciones de Fauna)
Registros de avistamientos automáticos o detectados por IA (ej. cámaras trampa).

**Campos Identificados:**
- `sector` (string): Área del avistamiento (ej. "sector_abanico").
- `especie` (string): Nombre científico o común (ej. "Panthera onca").
- `individuoId` (string): Identificador único del animal si es conocido (ej. "Macho Alfa").
- `timestamp` (timestamp string/ISO): Fecha y hora del avistamiento.
- `comportamiento` (string): Actividad registrada (ej. "caminando", "con_crias").
- `velocidad` (string): Velocidad de movimiento.
- `vocalizacion` (boolean): Si se detectó sonido.
- `confianza` (number): Nivel de certeza de la IA (0-1).
- `coordenadas` (map): Ubicación exacta.
  - `lng` (number)
  - `lat` (number)

**Referencia en código:** `src/agents/fieldAgent.js`, `src/services/arStationService.js`

---

### 5. `reportes_campo` (Reportes de Usuarios)
Avistamientos reportados manualmente por usuarios/guías.

**Campos Identificados:**
- `tipo` (string): Tipo de reporte (ej. "avistamiento_usuario").
- `descripcion` (string): Detalle del avistamiento.
- `timestamp` (timestamp string): Fecha y hora del reporte.
- `validado` (boolean): Estado de validación por expertos.
- `requiere_revision` (boolean): Indicador para moderación.

**Referencia en código:** `src/agents/fieldAgent.js`

---

### 6. `ar_interactions` (Interacciones AR)
Registro de uso de las estaciones de Realidad Aumentada.

**Campos Identificados:**
- `userId` (string): ID del usuario.
- `stationId` (string): ID de la estación AR.
- `action` (string): Acción realizada (ej. "view", "photo", "share").
- `timestamp` (timestamp string): Fecha y hora de la interacción.

**Referencia en código:** `src/services/arStationService.js`

---

## Notas Adicionales
- La configuración de Firebase se encuentra en `src/config/firebase.js`.
- Existe un script de migración en `src/utils/migrateToFirestore.js` que se utiliza para poblar la base de datos con datos iniciales desde archivos JSON locales.
