/**
 * Lidar/DEM Filtering Utilities
 * 
 * Provides functions to filter Digital Elevation Models (DEM), 
 * specifically for removing vegetation (Canopy) to estimate Bare Earth.
 */

/**
 * Applies a morphological "opening" operation (Erosion followed by Dilation)
 * to estimate the bare earth surface by removing small high-frequency objects (trees/canopy).
 * 
 * Ideally used on DSM (Digital Surface Model) to approximate DTM (Digital Terrain Model).
 * 
 * @param {number[][]} grid - The input elevation grid (DSM).
 * @param {number} windowSize - Size of the structuring element (kernel) in cells. Should be larger than typical tree canopy size.
 * @returns {number[][]} The filtered grid (Estimated DTM).
 */
export function filterCanopy(grid, windowSize = 3) {
    const rows = grid.length;
    const cols = grid[0].length;

    // 1. Erosion: Replace each value with the minimum in the window
    // This removes positive spikes (trees)
    const eroded = createGrid(rows, cols);

    const offset = Math.floor(windowSize / 2);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let minVal = Infinity;

            for (let dy = -offset; dy <= offset; dy++) {
                for (let dx = -offset; dx <= offset; dx++) {
                    const cy = y + dy;
                    const cx = x + dx;

                    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
                        minVal = Math.min(minVal, grid[cy][cx]);
                    }
                }
            }
            eroded[y][x] = minVal;
        }
    }

    // 2. Dilation: Replace each value with the maximum in the window
    // This restores the shape of larger features (terrain)
    const opened = createGrid(rows, cols);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let maxVal = -Infinity;

            for (let dy = -offset; dy <= offset; dy++) {
                for (let dx = -offset; dx <= offset; dx++) {
                    const cy = y + dy;
                    const cx = x + dx;

                    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
                        maxVal = Math.max(maxVal, eroded[cy][cx]);
                    }
                }
            }
            opened[y][x] = maxVal;
        }
    }

    return opened;
}

/**
 * Helper to create an empty 2D grid.
 */
function createGrid(rows, cols) {
    const grid = new Array(rows);
    for (let i = 0; i < rows; i++) {
        grid[i] = new Float32Array(cols); // Use TypedArray for performance
    }
    return grid;
}
