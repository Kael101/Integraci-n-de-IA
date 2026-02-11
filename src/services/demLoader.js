/**
 * DEM (Digital Elevation Model) Loader Service
 * 
 * Handles loading of elevation data for specific regions.
 * Currently simulates loading from a mock source or Mapbox Terrain-RGB pattern.
 */

class DEMLoader {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Loads elevation data for a given bounding box.
     * @param {Object} bounds - { north, south, east, west }
     * @returns {Promise<number[][]>} 2D array of elevation values.
     */
    async loadDEMRegion(bounds) {
        console.log("Loading DEM for bounds:", bounds);

        // TODO: Connect to real API (e.g., Mapbox, AWS Terrain, or local GeoTIFF)
        // For Phase 1 prototype, we return a procedurally generated terrain
        // that mimics the Morona Santiago Andean/Amazonian transition.

        return this.generateMockTerrain(100, 100);
    }

    /**
     * Generates a mock terrain grid for testing analysis algorithms.
     * Includes:
     * - A "Volcano" shape
     * - A "River Valley"
     * - Random high-frequency "Canopy" noise
     */
    generateMockTerrain(width, height) {
        const grid = new Array(height);
        for (let y = 0; y < height; y++) {
            grid[y] = new Float32Array(width);
            for (let x = 0; x < width; x++) {
                // Base terrain: Slope downwards W -> E
                let elevation = (width - x) * 10;

                // Feature 1: Volcano at (30, 30)
                const distV = Math.sqrt((x - 30) ** 2 + (y - 30) ** 2);
                if (distV < 20) {
                    elevation += 2000 * Math.exp(-0.1 * distV);
                }

                // Feature 2: Rugged Mountain Ridge at Y=70
                const distM = Math.abs(y - 70);
                elevation += 1000 * Math.exp(-0.1 * distM) + Math.random() * 50;

                // "Canopy" Noise (High frequency)
                elevation += Math.random() * 15; // Trees 0-15m high

                grid[y][x] = elevation;
            }
        }
        return grid;
    }

    /**
     * Converts Mapbox Terrain-RGB pixel values to height in meters.
     * formula: height = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)
     */
    static decodeTerrainRGB(r, g, b) {
        return -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
    }
}

export const demLoader = new DEMLoader();
