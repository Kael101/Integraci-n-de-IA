[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](https://opensource.org/licenses/MIT)
[![Stack: React + Vite](https://img.shields.io/badge/Stack-React%20%2B%20Vite-blue.svg)](https://vitejs.dev/)
[![Location: Morona Santiago, EC](https://img.shields.io/badge/Region-Morona%20Santiago%2C%20EC-orange.svg)]()

**Territorio Jaguar** es una plataforma ecosistémica diseñada para la protección, exploración y fomento del bio-comercio en la provincia de Morona Santiago, Ecuador. Combina tecnología Geoespacial, Realidad Aumentada y mecanismos de Seguridad Comunitaria para ofrecer una experiencia única en el corazón de la Amazonía.

---

## 🌟 Pilares del Proyecto

### 🛡️ Seguridad y Resiliencia (Sentinel)
- **Navegación Táctica Offline**: Mapas topográficos y rutas GPX que funcionan sin conexión a internet, críticas para la seguridad en la selva.
- **Reportes Comunitarios**: Sistema de alertas ambientales (deforestación, incendios, contaminación) con **Privacidad Diferencial** (fuzzing de ±1km) para proteger la identidad de los informantes.
- **Botón SOS Universal**: Acceso inmediato a protocolos de emergencia y primeros auxilios contextuales.

### 🏛️ Visión Ancestral (LiDAR & AR)
- **Capas Arqueológicas**: Visualización de la civilización de los Valles del Upano (2,500 años de antigüedad) mediante tecnología LiDAR proyectada en el mapa.
- **AR Explorer**: Identificación de flora endémica, constelaciones amazónicas y visualización 3D de piezas arqueológicas en tiempo real.

### 🍃 Bio-Comercio Circular (Jungle Protein)
- **Marketplace Local**: Conexión directa con artesanos y productores de bio-insumos (como el Chontacuro y Guayusa).
- **Jaguar Coins**: Economía gamificada donde las acciones de conservación (reportes, visitas a hitos) se recompensan con monedas canjeables en comercios locales.

---

## 🛠️ Stack Tecnológico

- **Frontend**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Mapas**: [MapLibre GL](https://maplibre.org/) & [React Map GL](https://visgl.github.io/react-map-gl/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) (Glassmorphism & Andean Gold palette)
- **Backend / DB**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage)
- **Cómputo Local**: Agentes AI para procesamiento de datos en el borde y soporte al viajero.

---

## 📂 Estructura del Proyecto

```bash
├── public/                # Activos estáticos y rutas GPX
├── src/
│   ├── components/        # Componentes UI organizados por módulos (map, ar, sentinel, etc.)
│   ├── context/           # Estado global (Auth, Map, Gamification)
│   ├── hooks/             # Lógica reutilizable (useUserLocation, useRouteTracking)
│   ├── services/          # Integraciones con Firebase y MCP
│   ├── specs/             # Documentación técnica detallada y esquemas
│   └── utils/             # Helpers de cálculo geográfico y privacidad
├── .cursorrules           # Reglas de comportamiento del Agente Orquestador
└── tailwind.config.js     # Configuración de diseño (Sistema de diseño Jaguar)
```

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js (v18+)
- Cuenta de Firebase (para funciones de base de datos)

### Instalación
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Kael101/Integraci-n-de-IA.git
   cd TerritorioJaguar
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno:
   Crea un archivo `.env` basado en `.env.example` con tus credenciales de Firebase.

4. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## 📜 Especificaciones Técnicas
Para una inmersión profunda en la arquitectura, revisa los documentos en la carpeta `/specs/`:
- [Integración de Mapas](specs/map_integration.md)
- [Esquema de Base de Datos](specs/database_schema.md)
- [Módulo de Emergencias](specs/emergency_module.md)

---

## 🤝 Contribución
Este es un proyecto enfocado en el desarrollo local de Morona Santiago. Si deseas contribuir con datos geográficos, modelos 3D de flora o mejoras en el sistema de seguridad, por favor abre un *Issue* o envía un *Pull Request*.

---

## ⚖️ Licencia
Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

© 2026 **Territorio Jaguar** - Macas, Morona Santiago, Ecuador.
