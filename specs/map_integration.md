# ESPECIFICACIONES TÉCNICAS: MAP MODULE (REACT + VITE)

## 1. Stack Tecnológico
- **Core:** React (Functional Components + Hooks).
- **Map Engine:** `react-map-gl` (Wrapper de Mapbox para React) o `mapbox-gl` directo.
- **Estilos:** Tailwind CSS (Prioridad a utilidades de vidrio: `backdrop-blur`, `bg-opacity`).
- **Iconos:** Lucide React.
- **Estado:** Context API o Zustand (para manejar la ruta activa).

## 2. Integración Visual (UI "Territorio Jaguar")
- **Controles del Mapa:** NO usar los controles por defecto de Mapbox. Crear botones personalizados flotantes usando Tailwind:
    - Estilo: `bg-white/10 backdrop-blur-md border border-white/20 rounded-full`.
    - Iconos: Usar `<Plus />`, `<Minus />`, `<Navigation />` de Lucide.
- **Marcadores:** Custom Markers usando componentes de React, no imágenes estáticas, para poder animarlos con CSS (ej. un pulso "ping" en la ubicación actual).

## 3. Lógica Offline (Crítica)
- **Rutas (Data):** Las coordenadas de las rutas (GeoJSON) deben guardarse usando el `syncService.js` existente para estar disponibles sin red.
- **Tiles (Mapas base):** Configurar la caché del Service Worker para intentar guardar los tiles del área visitada (Best effort).

## 4. Comportamiento del Componente `MapCanvas.jsx`
- Al montar, verificar si hay conexión.
    - Si HAY conexión: Cargar tiles de alta resolución.
    - Si NO hay conexión: Cargar estilo simplificado o fallback, y leer rutas desde `localStorage` vía `syncService`.
