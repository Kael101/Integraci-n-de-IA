// src/data/ruta_upano.js

/**
 * RUTA OFICIAL: ALINEACIÓN CALLE 24 DE MAYO (Grid Correction)
 * Ajuste fino de coordenadas para coincidir con el eje vial.
 */
export const rutaUpano = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "Ruta Urbana: Eje Vial",
                "difficulty": "Baja",
                "duration": "50 min",
                "distance": "3.8 km",
                "description": "Ruta alineada a las aceras del centro."
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    // Start: Parque (Adjusted slightly East)
                    [-78.1182, -2.3038],

                    // Walk South along main street (Amazonas?)
                    [-78.1182, -2.3085],

                    // Turn Left (East) at intersection
                    [-78.1158, -2.3085],

                    // Turn Right (South) towards Malecón
                    [-78.1158, -2.3120]
                ]
            }
        }
    ]
};
