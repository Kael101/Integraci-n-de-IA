/**
 * Terrain Analysis Utilities
 * 
 * Provides functions to calculate topographic prominence, gradient,
 * and classify landforms based on elevation data.
 */

/**
 * Calculates the gradient magnitude at a specific point in an elevation grid.
 * Uses a simple central difference approximation.
 * 
 * @param {number[][]} elevationGrid - 2D array of elevation values.
 * @param {number} x - X coordinate of the point.
 * @param {number} y - Y coordinate of the point.
 * @param {number} cellSize - physical size of each cell in meters (default 1).
 * @returns {number} Gradient magnitude (slope).
 */
export function calculateGradient(elevationGrid, x, y, cellSize = 1) {
    const rows = elevationGrid.length;
    const cols = elevationGrid[0].length;

    // Boundary checks
    if (x <= 0 || x >= cols - 1 || y <= 0 || y >= rows - 1) {
        return 0; // Return 0 gradient at edges for simplicity
    }

    // Central difference
    const dz_dx = (elevationGrid[y][x + 1] - elevationGrid[y][x - 1]) / (2 * cellSize);
    const dz_dy = (elevationGrid[y + 1][x] - elevationGrid[y - 1][x]) / (2 * cellSize);

    return Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy);
}

/**
 * Estimates the topographic prominence of a peak using a local window approach.
 * Note: True prominence requires global analysis. This is a local approximation
 * suitable for real-time/interactive use.
 * 
 * @param {number[][]} elevationGrid - 2D array of elevation values.
 * @param {number} peakX - X coordinate of the peak.
 * @param {number} peakY - Y coordinate of the peak.
 * @param {number} searchRadius - Radius in cells to search for key saddle.
 * @returns {number} Estimated prominence value.
 */
export function calculateProminence(elevationGrid, peakX, peakY, searchRadius = 20) {
    const peakHeight = elevationGrid[peakY][peakX];
    const rows = elevationGrid.length;
    const cols = elevationGrid[0].length;

    let minHeightInWindow = peakHeight;
    let maxHeightInWindow = -Infinity;

    const startY = Math.max(0, peakY - searchRadius);
    const endY = Math.min(rows - 1, peakY + searchRadius);
    const startX = Math.max(0, peakX - searchRadius);
    const endX = Math.min(cols - 1, peakX + searchRadius);

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            const h = elevationGrid[y][x];
            if (h < minHeightInWindow) minHeightInWindow = h;
            if (h > maxHeightInWindow) maxHeightInWindow = h;
        }
    }

    if (maxHeightInWindow > peakHeight) {
        // Not the highest peak in the window. 
        return 0;
    } else {
        // Highest in local window
        return peakHeight - minHeightInWindow;
    }
}

/**
 * Classifies a landform based on its geometric properties.
 * 
 * @param {number} elevation - Absolute elevation in meters.
 * @param {number} prominence - Calculated prominence in meters.
 * @param {number} gradient - Average gradient/slope.
 * @returns {string} Classification: 'Cerro', 'Montaña', 'Volcán', 'Cordillera', or 'Llanura'.
 */
export function classifyLandform(elevation, prominence, gradient) {
    // Thresholds (can be tuned based on Morona Santiago geography)
    const MIN_CERRO_PROMINENCE = 50;  // meters
    const MIN_MOUNTAIN_PROMINENCE = 300; // meters
    const MIN_VOLCANO_ELEVATION = 1500; // meters, usually high
    const MIN_VOLCANO_GRADIENT = 0.5; // steep slopes

    if (prominence < MIN_CERRO_PROMINENCE) return 'Llanura';

    // Check for Volcano characteristics (High elevation + Steep + High Prominence)
    if (elevation > MIN_VOLCANO_ELEVATION && gradient > MIN_VOLCANO_GRADIENT && prominence > MIN_MOUNTAIN_PROMINENCE) {
        return 'Volcán';
    }

    if (prominence >= MIN_MOUNTAIN_PROMINENCE) {
        return 'Montaña';
    }

    return 'Cerro';
}

/**
 * Scans a DEM grid to find and classify peaks.
 * @param {number[][]} elevationGrid 
 * @param {number} cellSize 
 * @returns {Array} List of detected features with type and coordinates.
 */
export function findPeaks(elevationGrid, cellSize = 1) {
    const peaks = [];
    const rows = elevationGrid.length;
    const cols = elevationGrid[0].length;

    // 1. Identify all local maxima (candidates)
    // We use >= to allow for plateaus (flat tops created by filtering)
    const candidates = [];
    for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
            const h = elevationGrid[y][x];

            let isLocalMax = true;
            let isFlat = true; // Check if it's just a flat plain

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dy === 0 && dx === 0) continue;
                    const neighborH = elevationGrid[y + dy][x + dx];
                    if (neighborH > h) {
                        isLocalMax = false;
                        break;
                    }
                    if (neighborH !== h) {
                        isFlat = false;
                    }
                }
                if (!isLocalMax) break;
            }

            // We ignore perfectly flat areas (all neighbors equal) unless we have a way to distinguish them.
            // E.g., The center of a plateau. 
            // For simplicity, we accept all points on a plateau as candidates and filter them by proximity later.
            if (isLocalMax && !isFlat) {
                candidates.push({ x, y, h });
            }
        }
    }

    // 2. Filter duplicate peaks that are too close (Plateau reduction)
    // Sort by elevation descending, so we keep the highest point (or first found among equals)
    candidates.sort((a, b) => b.h - a.h);

    const finalPeaks = [];
    const MIN_PEAK_DIST = 10; // Minimum distance between distinct peaks

    for (const cand of candidates) {
        // Check if close to an already accepted peak
        const tooClose = finalPeaks.some(p => {
            const dx = p.x - cand.x;
            const dy = p.y - cand.y;
            return (dx * dx + dy * dy) < (MIN_PEAK_DIST * MIN_PEAK_DIST);
        });

        if (!tooClose) {
            // It's a new distinct peak
            const gradient = calculateGradient(elevationGrid, cand.x, cand.y, cellSize);
            const prominence = calculateProminence(elevationGrid, cand.x, cand.y, 20);
            const type = classifyLandform(cand.h, prominence, gradient);

            if (type !== 'Llanura') {
                finalPeaks.push({
                    x: cand.x,
                    y: cand.y,
                    elevation: cand.h,
                    prominence,
                    gradient,
                    type
                });
            }
        }
    }

    return finalPeaks;
}
