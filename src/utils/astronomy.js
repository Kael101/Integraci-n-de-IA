import * as Astronomy from 'astronomy-engine';
import * as THREE from 'three';

/**
 * Calcula la posición cartesiana (Vector3) de un objeto celeste para Three.js
 * @param {Date} date Fecha actual
 * @param {Object} location { lat, lon, elevation }
 * @param {number} ra Right Ascension (horas)
 * @param {number} dec Declination (grados)
 * @param {number} radius Distancia de proyección (radio de la esfera celeste)
 * @returns {THREE.Vector3}
 */
export const getStarPosition = (date, location, ra, dec, radius = 100) => {
    // 1. Crear observador
    const observer = new Astronomy.Observer(location.lat, location.lon, location.elevation || 0);

    // 2. Coordenadas Ecuatoriales (J2000)
    // Astronomy engine usa RA en horas y Dec en grados
    // Pero Equator espera RA en horas y Dec en grados.
    const equator = new Astronomy.Equator(
        ra,
        dec,
        2000.0 // Epoch J2000 (standard for catalogs)
    );

    // 3. Convertir a Coordenadas Horizontales (Azimut, Altitud)
    const horizon = Astronomy.Horizon(date, observer, equator.ra, equator.dec, 'normal');

    // 4. Convertir a Cartesianas (Three.js)
    // Three.js: Y es arriba (Zenith).
    // Azimut: 0 = Norte (Z-), 90 = Este (X+), 180 = Sur (Z+), 270 = Oeste (X-)
    // Altitud: 90 = Zenith (Y+), 0 = Horizonte.

    const az = THREE.MathUtils.degToRad(horizon.azimuth);
    const alt = THREE.MathUtils.degToRad(horizon.altitude);

    // Formulas:
    // x = R * cos(alt) * sin(az)
    // y = R * sin(alt)
    // z = -R * cos(alt) * cos(az)  (Nota el negativo para alinear con Three.js Z- forward, o ajustar según la cámara)

    // En Three.js default: -Z es hacia adelante (Norte), +X es derecha (Este)? Depende de la cámara.
    // Asumiremos: -Z Norte, +X Este, +Y Arriba.
    // Azimut se mide desde el Norte (0) hacia el Este.

    const x = radius * Math.cos(alt) * Math.sin(az); // + sin(az) -> Este
    const y = radius * Math.sin(alt);
    const z = -radius * Math.cos(alt) * Math.cos(az); // - cos(az) -> Norte

    return new THREE.Vector3(x, y, z);
};

// Pequeño catálogo de estrellas brillantes para pruebas (RA en horas, Dec en grados)
// Fuente J2000
export const BRIGHT_STARS = [
    { name: "Sirio", ra: 6.75, dec: -16.72, color: '#A0C8FF' },
    { name: "Canopus", ra: 6.40, dec: -52.70, color: '#FFFFFF' },
    { name: "Arturo", ra: 14.26, dec: 19.18, color: '#FFD2A0' },
    { name: "Vega", ra: 18.62, dec: 38.78, color: '#A0C8FF' },
    { name: "Rigel", ra: 5.24, dec: -8.20, color: '#A0C8FF' },
    { name: "Betelgeuse", ra: 5.92, dec: 7.41, color: '#FF7F7F' },
    { name: "Procyon", ra: 7.65, dec: 5.22, color: '#FFFFA0' },
];
