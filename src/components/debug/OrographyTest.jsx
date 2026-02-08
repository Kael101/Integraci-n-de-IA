import React, { useEffect, useState } from 'react';
import { detectar_orografia } from '../../utils/orography';

/**
 * OROGRAPHY TEST DEBUGGER
 * Visualizador simple para probar el algoritmo de detección de picos.
 */
const OrographyTest = () => {
    const [results, setResults] = useState([]);
    const [gridSize, setGridSize] = useState(50);

    useEffect(() => {
        runTest();
    }, []);

    const runTest = () => {
        // 1. Generar DEM Sintético (Un "Volcán" y unas "Colinas")
        const grid = generateSyntheticDEM(gridSize);

        // 2. Ejecutar Algoritmo
        const detected = detectar_orografia(grid, { resolution: 10, biome: 'jungle' });
        setResults(detected);
        console.log("Orografía Detectada:", detected);
    };

    // Generador de Terreno de Prueba
    const generateSyntheticDEM = (size) => {
        const grid = Array(size).fill(0).map(() => Array(size).fill(0));

        // Función auxiliar para agregar una elevación Gaussiana (Montaña/Cerro)
        const addHill = (cx, cy, height, spread) => {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    const z = height * Math.exp(-(dist ** 2) / (2 * spread ** 2));
                    grid[y][x] += z;
                }
            }
        };

        // Escenario:
        // 1. Un gran Volcán (Alto, Cónico)
        addHill(25, 25, 2500, 5); // Centro, 2500m altura

        // 2. Unos Cerros pequeños alrededor
        addHill(10, 10, 200, 3);
        addHill(40, 40, 150, 4);

        // 3. Ruido de vegetación (para probar filtro)
        // Agregamos "árboles" aleatorios de 30m
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                grid[i][j] += Math.random() * 30;
            }
        }

        return grid;
    };

    return (
        <div className="p-6 bg-jaguar-950 text-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4 font-display text-jaguar-400">Prueba de Algoritmo: Peak Finder</h1>

            <div className="grid grid-cols-2 gap-8">
                {/* Panel de Resultados */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h2 className="text-lg font-bold mb-3">Entidades Detectadas</h2>
                    {results.length === 0 ? (
                        <p className="text-gray-500">Ejecutando análisis...</p>
                    ) : (
                        <ul className="space-y-2">
                            {results.map((item, idx) => (
                                <li key={idx} className="bg-black/30 p-2 rounded border border-white/5 flex justify-between items-center">
                                    <div>
                                        <span className={`font-bold px-2 py-0.5 rounded text-xs mr-2 
                                            ${item.type === 'Volcán' ? 'bg-red-500/20 text-red-400' :
                                                item.type === 'Montaña' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-green-500/20 text-green-400'}`}>
                                            {item.type}
                                        </span>
                                        <span className="text-sm">
                                            Alt: {Math.round(item.altitude)}m | Prom: {Math.round(item.prominence)}m
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        [{item.coordinates.x}, {item.coordinates.y}]
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <button
                        onClick={runTest}
                        className="mt-4 w-full py-2 bg-jaguar-500 text-jaguar-950 font-bold rounded hover:bg-jaguar-400 transition"
                    >
                        Re-Ejecutar Simulación
                    </button>
                </div>

                {/* Explicación */}
                <div className="text-sm text-gray-300 space-y-4">
                    <p>
                        Esta prueba genera un <strong>DEM Sintético</strong> con:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Una estructura central alta (simulando Volcán ~2500m).</li>
                        <li>Dos estructuras menores (Cerros ~200m).</li>
                        <li>Ruido aleatorio de 0-30m (simulando vegetación).</li>
                    </ul>
                    <p>
                        El algoritmo <code>detectar_orografia</code> aplica:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li><strong>Filtro de Vegetación:</strong> Resta 30m en bioma selva.</li>
                        <li><strong>Detección de Maximos:</strong> Busca picos locales.</li>
                        <li><strong>Cálculo de Prominencia:</strong> Estima altura relativa.</li>
                        <li><strong>Clasificación:</strong> Aplica umbrales de altitud y pendiente.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default OrographyTest;
