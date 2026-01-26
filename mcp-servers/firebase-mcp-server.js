// mcp-servers/firebase-mcp-server.js
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, addDoc, orderBy, limit } from "firebase/firestore";

/**
 * SERVIDOR MCP PARA FIREBASE - TERRITORIO JAGUAR
 * Expone las operaciones de Firestore como herramientas MCP
 */

// Configuración Firebase
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyD8WIohR2IjnXd0qMP8E2ttmB0h7UMeBQY",
    authDomain: "territorio-jaguar.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "territorio-jaguar",
    storageBucket: "territorio-jaguar.firebasestorage.app",
    messagingSenderId: "628995955087",
    appId: process.env.APP_ID || "1:628995955087:web:2ab886cc920eae685fd3fa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Crear servidor MCP
const server = new Server(
    {
        name: "jaguar-conservation-db",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Definir herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "fetch_latest_reports",
                description: "Obtiene las últimas detecciones de jaguares por IA en un sector específico. Usado por Agente A (Campo/AR) para inyectar datos a estaciones AR.",
                inputSchema: {
                    type: "object",
                    properties: {
                        sector: {
                            type: "string",
                            description: "ID del sector (ej: 'sector_abanico', 'sector_cascada')",
                        },
                        limit: {
                            type: "number",
                            description: "Número máximo de detecciones a retornar",
                            default: 1,
                        },
                    },
                    required: ["sector"],
                },
            },
            {
                name: "add_report_to_db",
                description: "Registra una nueva evidencia biológica (huella, avistamiento) reportada por guías o turistas. Usado por Agente A para validar reportes de campo.",
                inputSchema: {
                    type: "object",
                    properties: {
                        tipo: {
                            type: "string",
                            description: "Tipo de evidencia: 'huella', 'avistamiento', 'vocalizacion'",
                        },
                        sector: {
                            type: "string",
                            description: "Sector donde se encontró la evidencia",
                        },
                        descripcion: {
                            type: "string",
                            description: "Descripción detallada del reporte",
                        },
                        coordenadas: {
                            type: "object",
                            properties: {
                                lng: { type: "number" },
                                lat: { type: "number" },
                            },
                        },
                    },
                    required: ["tipo", "sector", "descripcion"],
                },
            },
            {
                name: "fetch_marketplace_items",
                description: "Obtiene el catálogo de productos artesanales disponibles. Usado por Agente C (Biocomercio) para conectar turistas con artesanos.",
                inputSchema: {
                    type: "object",
                    properties: {
                        category: {
                            type: "string",
                            description: "Categoría de producto: 'Artesanía', 'Gastronomía', 'Equipo'",
                        },
                    },
                },
            },
        ],
    };
});

// Implementar lógica de herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "fetch_latest_reports": {
                const q = query(
                    collection(db, "detecciones_ia"),
                    where("sector", "==", args.sector),
                    orderBy("timestamp", "desc"),
                    limit(args.limit || 1)
                );

                const snapshot = await getDocs(q);
                const detections = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(detections, null, 2),
                        },
                    ],
                };
            }

            case "add_report_to_db": {
                const reportDoc = {
                    ...args,
                    timestamp: new Date().toISOString(),
                    validado: false,
                };

                const docRef = await addDoc(collection(db, "reportes_campo"), reportDoc);

                return {
                    content: [
                        {
                            type: "text",
                            text: `Reporte registrado exitosamente con ID: ${docRef.id}`,
                        },
                    ],
                };
            }

            case "fetch_marketplace_items": {
                let q = collection(db, "productos");

                if (args.category) {
                    q = query(q, where("category", "==", args.category));
                }

                const snapshot = await getDocs(q);
                const products = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(products, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Herramienta desconocida: ${name}`);
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

// Iniciar servidor
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Firebase MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
