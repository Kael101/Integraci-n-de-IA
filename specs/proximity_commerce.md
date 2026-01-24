# ESPECIFICACIONES TÉCNICAS: PROXIMITY COMMERCE & DISCOVERY

## 1. Integración de Datos (Marketplace -> Mapa)
- **Fuente de Verdad:** El `InventoryModule` y `ProviderDashboard`.
- **Transformación:** El sistema debe generar un archivo `providers.geojson` que contenga:
    - Coordenadas (Lat/Lng).
    - Metadatos vitales: Nombre, ID del negocio, URL de thumbnail, Categoría, Horarios.
    - **Importante:** Estos datos deben sincronizarse vía `syncService.js` al cargar la ruta, para estar disponibles offline.

## 2. Motor de Proximidad (Geofencing)
- **Librería:** Instalar `@turf/turf`.
- **Lógica:**
    - Crear un hook `useProximityAlert.js` que escuche la posición del GPS del usuario.
    - Cada 30 segundos (o cada 100 metros), calcular la distancia (`turf.distance`) contra la lista de proveedores cercanos.
    - Si distancia < 500m Y la alerta no se ha mostrado hoy -> Disparar evento de UI.

## 3. UI/UX: La "Provider Card" (React + Tailwind)
- **Componente:** `ProviderMapCard.jsx`
- **Estilo:**
    - Fondo: `bg-slate-900/60 backdrop-blur-xl border-t border-white/20`.
    - Animación: `motion-safe:animate-slide-up` (deslizar desde abajo).
- **Contenido Visual:**
    - Mostrar carrusel de imágenes pequeño si hay conexión.
    - Mostrar imagen destacada estática (base64 o local blob) si está offline.

## 4. Interacción con el Marketplace
- Al hacer clic en la tarjeta, no sacar al usuario del mapa completamente.
- Abrir un "Sheet" (Hoja modal) que muestre el `InventoryModule` filtrado para ESE vendedor.
- Permitir "Reservar" o "Pedir" para recoger al llegar (se guarda en `syncService` y se sube al recuperar señal).
