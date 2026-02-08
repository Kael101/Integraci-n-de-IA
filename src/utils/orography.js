// src/utils/orography.js

/**
 * MÓDULO DE RECONOCIMIENTO OROGRÁFICO (PEAK FINDER)
 * 
 * Implementación matemática para clasificar entidades geográficas
 * basada en análisis de DEM (Digital Elevation Model).
 */

// Configuración de constantes físicas y umbrales
const THRESHOLDS = {
    PROMINENCE: {
        HILL: 300,        // Metros. Menor a esto es Cerro/Colina
        MOUNTAIN: 300     // Metros. Mayor a esto es Montaña
    },
    ALTITUDE: {
        MOUNTAIN_MIN: 1000 // msnm. Mínimo para ser considerado Montaña alta
    },
    SLOPE: {
        STEEP: 20          // Grados. Pendiente abrupta
    },
    VEGETATION: {
        AMAZON_CANOPY_AVG: 30 // Metros. Altura promedio estimada de árboles en selva
    }
};

/**
 * Función Principal: Detectar Orografía
 * @param {number[][]} demGrid - Matriz 2D de elevaciones (Z)
 * @param {Object} options - Configuración { resolution: metros_por_pixel, biome: 'jungle' | 'andes' }
 * @returns {Array} Lista de entidades detectadas
 */
export const detectar_orografia = (demGrid, options = { resolution: 30, biome: 'jungle' }) => {
    const rows = demGrid.length;
    const cols = demGrid[0].length;
    const entities = [];

    // 1. FILTRO DE VEGETACIÓN (Pre-procesamiento)
    // Ajustamos Z para obtener "Bare Earth" estimado
    const adjustedGrid = demGrid.map(row =>
        row.map(z => applyVegetationFilter(z, options.biome))
    );

    // 2. IDENTIFICACIÓN DE PUNTOS CRÍTICOS (Cimas Locales)
    const localMaxima = findLocalMaxima(adjustedGrid);

    // 3. ANÁLISIS DE CADA CIMA
    for (const peak of localMaxima) {
        const { x, y, z } = peak;

        // A. Cálculo de Prominencia y Aislamiento
        const prominence = calculateProminence(peak, adjustedGrid);

        // B. Análisis de Forma (Gradiente y Curvatura)
        const shape = analyzeShape(peak, adjustedGrid, options.resolution);

        // 4. CLASIFICACIÓN LÓGICA
        const entityType = classifyEntity(z, prominence, shape);

        if (entityType) {
            entities.push({
                type: entityType,
                coordinates: { x, y },
                altitude: z,
                prominence: prominence,
                details: shape
            });
        }
    }

    return entities;
};

/**
 * Ajusta la elevación restando la altura estimada del dosel si es selva.
 */
const applyVegetationFilter = (z, biome) => {
    if (biome === 'jungle') {
        // En selva, restamos la altura del árbol para no detectar copas como picos
        return Math.max(0, z - THRESHOLDS.VEGETATION.AMAZON_CANOPY_AVG);
    }
    return z; // En Andes/Páramo, asumimos vegetación baja o roca
};

/**
 * Encuentra máximos locales comparando con 8 vecinos.
 */
const findLocalMaxima = (grid) => {
    const maxima = [];
    const rows = grid.length;
    const cols = grid[0].length;

    for (let i = 1; i < rows - 1; i++) {
        for (let j = 1; j < cols - 1; j++) {
            const currentZ = grid[i][j];
            let isMax = true;

            // Comparar con 8 vecinos
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    if (di === 0 && dj === 0) continue;
                    if (grid[i + di][j + dj] >= currentZ) {
                        isMax = false;
                        break;
                    }
                }
                if (!isMax) break;
            }

            if (isMax) {
                maxima.push({ x: j, y: i, z: currentZ });
            }
        }
    }
    return maxima;
};

/**
 * Estima la prominencia topográfica.
 * (Simplificación: Búsqueda radial del "col" o silla más alta que conecta a un pico mayor).
 */
const calculateProminence = (peak, grid) => {
    // NOTA: El cálculo real de prominencia es computacionalmente costoso (O(N log N) o grafos).
    // Aquí usamos una heurística local simplificada para demostración:
    // "Cuánto baja el terreno alrededor antes de volver a subir"

    let minHeightAround = peak.z;
    const radius = 10; // Radio de búsqueda en celdas (ajustar según resolución)
    const rows = grid.length;
    const cols = grid[0].length;

    // Escanear un anillo alrededor
    // Si encontramos un punto MAYOR fuera del radio, la prominencia es Z_peak - Z_silla_mas_alta
    // Esta es una simplificación drástica.

    // Para el MVP, asumimos prominencia = Z_peak - Z_min_local (Elevación relativa simple)
    // Esto es técnicamente "Altura Relativa", no prominencia estricta, pero funcional para la demo.

    let minZ = peak.z;

    for (let i = Math.max(0, peak.y - radius); i < Math.min(rows, peak.y + radius); i++) {
        for (let j = Math.max(0, peak.x - radius); j < Math.min(cols, peak.x + radius); j++) {
            if (grid[i][j] < minZ) {
                minZ = grid[i][j];
            }
        }
    }

    return peak.z - minZ;
};

/**
 * Analiza la geometría local: Pendiente y Curvatura.
 */
const analyzeShape = (peak, grid, resolution) => {
    const { x, y } = peak;

    // Gradiente (Pendiente) promedio de los vecinos inmediatos
    let slopeSum = 0;
    let count = 0;

    for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            const dz = peak.z - grid[y + di][x + dj];
            const dist = Math.sqrt(di * di + dj * dj) * resolution;
            const slope = Math.atan(dz / dist) * (180 / Math.PI); // Grados
            slopeSum += slope;
            count++;
        }
    }

    const avgSlope = slopeSum / count;

    // Detección de Cráter (Inversión de curvatura/Hueco en la cima)
    // Un volcán suele tener un "anillo" alto con un centro deprimido. 
    // Como estamos en un máximo local, ya somos el punto más alto.
    // Para detectar cráter, necesitaríamos buscar si este "máximo" es parte de un borde (rim).
    // Simplificación: Si la pendiente es muy alta y constante (cónica).

    const isConical = avgSlope > 20 && avgSlope < 45; // Cono volcánico típico

    return { slope: avgSlope, isConical };
};

/**
 * Clasifica la entidad según las reglas definidas.
 */
const classifyEntity = (z, prominence, shape) => {
    // 1. VOLCÁN (Prioridad por forma/peligrosidad)
    // Requiere gran altura, prominencia y forma cónica (o detección de cráter)
    if (z > 2000 && prominence > 500 && shape.isConical) {
        return 'Volcán';
    }

    // 2. MONTAÑA
    if (prominence >= THRESHOLDS.PROMINENCE.MOUNTAIN || z > THRESHOLDS.ALTITUDE.MOUNTAIN_MIN) {
        return 'Montaña';
    }

    // 3. CERRO / COLINA
    if (prominence < THRESHOLDS.PROMINENCE.HILL && prominence > 20) { // >20m para no detectar ruido de suelo
        return 'Cerro';
    }

    // 4. CORDILLERA
    // La cordillera es un conjunto. Esta función clasifica PUNTOS.
    // El agrupamiento de 'Montañas' alineadas formaría la Cordillera en una capa superior.

    return null; // Ruido o terreno plano
};
