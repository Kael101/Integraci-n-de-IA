// src/data/upano_archaeology.js

/**
 * DATOS ARQUEOLÓGICOS DEL VALLE DEL UPANO
 * Basado en hallazgos recientes (LIDAR) de la cultura Kilamope/Upano (500 a.C. - 600 d.C.)
 */

export const upanoArchaeology = {
    "type": "FeatureCollection",
    "features": [
        // 1. COMPLEJOS DE MONTÍCULOS (Plataformas Habitacionales)
        {
            "type": "Feature",
            "properties": {
                "type": "complex",
                "name": "Complejo Kilamope",
                "description": "Centro ceremonial con plataformas de tierra conectadas.",
                "era": "500 a.C.",
                "glyph": "jaguar_sun"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [-78.1190, -2.3050],
                    [-78.1180, -2.3050],
                    [-78.1180, -2.3060],
                    [-78.1190, -2.3060],
                    [-78.1190, -2.3050]
                ]]
            }
        },
        // 2. CAMINOS REALES (Calzadas Rectilíneas)
        {
            "type": "Feature",
            "properties": {
                "type": "road",
                "name": "Calzada Real del Norte",
                "description": "Vía prehispánica rectilínea que conecta asentamientos.",
                "width": "10m"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-78.1185, -2.3030],
                    [-78.1185, -2.3090] // Recta perfecta N-S
                ]
            }
        },
        // 3. PUNTOS DE INTERÉS ARQUEOLÓGICO
        {
            "type": "Feature",
            "properties": {
                "type": "site",
                "name": "Montículo Central",
                "description": "Base de una estructura ceremonial de gran altura.",
                "height": "4m"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [-78.1185, -2.3055]
            }
        }
    ]
};
