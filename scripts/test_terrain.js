import { demLoader } from '../src/services/demLoader.js';
import { findPeaks } from '../src/utils/terrainAnalyzer.js';
import { filterCanopy } from '../src/utils/lidarFilters.js';

async function runTests() {
    console.log("Starting Terrain Intelligence Tests...");

    // 1. Generate Mock Terrain
    console.log("\n[1] Generating Mock Terrain...");
    // We use the internal method directly for testing
    const dem = demLoader.generateMockTerrain(100, 100);
    console.log(`Generated 100x100 grid.`);

    // 2. Test Lidar Filtering (Canopy Removal)
    console.log("\n[2] Testing Lidar Filtering (Canopy Removal)...");
    // Calculate average height before
    let sumBefore = 0;
    let count = 0;
    for (let row of dem) {
        for (let val of row) {
            sumBefore += val;
            count++;
        }
    }
    const avgBefore = sumBefore / count;

    const filteredDEM = filterCanopy(dem, 3); // 3x3 window

    // Calculate average height after
    let sumAfter = 0;
    for (let row of filteredDEM) {
        for (let val of row) {
            sumAfter += val;
        }
    }
    const avgAfter = sumAfter / count;

    console.log(`Average Height BEFORE: ${avgBefore.toFixed(2)}m`);
    console.log(`Average Height AFTER:  ${avgAfter.toFixed(2)}m`);
    console.log(`Change: ${(avgAfter - avgBefore).toFixed(2)}m (Should be negative due to canopy removal)`);

    // 3. Test Peak Finding & Classification
    console.log("\n[3] Testing Peak Finding & Classification...");

    // We explicitly mocked a Volcano at (30, 30). Let's see if we find it.
    const peaks = findPeaks(filteredDEM);

    console.log(`Found ${peaks.length} potential peaks.`);

    // Filter for significant ones to display
    const significantPeaks = peaks.filter(p => p.type === 'Volcán' || p.type === 'Montaña');

    console.log("\nSignificant Detected Landforms:");
    significantPeaks.forEach((p, idx) => {
        console.log(`${idx + 1}. [${p.type}] at (${p.x}, ${p.y}) - Elev: ${p.elevation.toFixed(1)}m, Prom: ${p.prominence.toFixed(1)}m, Grad: ${p.gradient.toFixed(2)}`);
    });

    // Verification 
    const volcano = significantPeaks.find(p => p.type === 'Volcán' && Math.abs(p.x - 30) < 5 && Math.abs(p.y - 30) < 5);

    if (volcano) {
        console.log("\n✅ SUCCESS: Simulated Volcano detected correctly!");
    } else {
        console.log("\n❌ FAILURE: Simulated Volcano NOT detected.");
    }
}

runTests().catch(err => console.error(err));
