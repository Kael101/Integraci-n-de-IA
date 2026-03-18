import { isWithinMoronaSantiago, isNearSevillaDonBosco } from '../src/utils/routeValidation.js';

const testRoutes = [
    {
        name: "Inside Morona Santiago",
        coords: [
            [-78.1065, -2.3121], // Sevilla Don Bosco
            [-78.0, -2.5],
        ],
        expectedSafe: true,
        expectedNearSevilla: true
    },
    {
        name: "Outside Morona Santiago (North)",
        coords: [
            [-78.1065, -1.0], 
        ],
        expectedSafe: false,
        expectedNearSevilla: false
    },
    {
        name: "Far from Sevilla Don Bosco (South MS)",
        coords: [
            [-77.5, -3.5], 
        ],
        expectedSafe: true,
        expectedNearSevilla: false
    }
];

console.log("--- Route Validation Tests ---");

testRoutes.forEach(test => {
    const isSafe = isWithinMoronaSantiago(test.coords);
    const isNear = isNearSevillaDonBosco(test.coords);
    
    const safePass = isSafe === test.expectedSafe;
    const nearPass = isNear === test.expectedNearSevilla;
    
    console.log(`Test: ${test.name}`);
    console.log(`  Safe: ${isSafe} (Expected: ${test.expectedSafe}) - ${safePass ? '✅' : '❌'}`);
    console.log(`  Near Sevilla: ${isNear} (Expected: ${test.expectedNearSevilla}) - ${nearPass ? '✅' : '❌'}`);
});
