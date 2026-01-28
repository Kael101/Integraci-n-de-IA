import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";

/**
 * CLIENTE MCP - TERRITORIO JAGUAR
 * Gestiona la conexión con los servidores MCP (Google Maps y Firebase)
 * Utiliza el SDK oficial de MCP.
 */
class MCPClient {
    constructor() {
        this.client = null;
        this.connected = false;
        this.transport = null;

        // Configuración de herramientas conocidas para fallback/simulación
        this.simulatedTools = {
            'google-maps': {
                'google_maps_search': this._simulateSearch,
                'google_maps_routing': this._simulateRouting,
                'google_maps_place_details': this._simulatePlaceDetails
            }
        };
    }

    /**
     * Conectar al servidor MCP
     * Intenta conectar via WebSocket, si falla y fallback=true, activa modo simulación.
     * @param {string} url - URL del WebSocket proxy (ej: ws://localhost:3000/mcp)
     */
    async connect(url = 'ws://localhost:3000/mcp') {
        try {
            console.log(`🔌 Conectando a MCP en ${url}...`);

            this.transport = new WebSocketClientTransport(new URL(url));
            this.client = new Client({
                name: "Territorio Jaguar Client",
                version: "1.0.0",
            }, {
                capabilities: {
                    sampling: {}
                }
            });

            await this.client.connect(this.transport);
            this.connected = true;
            console.log('✅ MCP Server conectado exitosamente.');

            // Listar herramientas disponibles para debug
            const tools = await this.client.listTools();
            console.log('🛠️ Herramientas disponibles:', tools);

            return { success: true };

        } catch (error) {
            console.warn('⚠️ No se pudo conectar al servidor MCP real. Activando modo simulación.', error);
            this.connected = false;
            return { success: true, mode: 'simulation' };
        }
    }

    /**
     * Llamar a una herramienta MCP
     */
    async callTool(server, toolName, args) {
        // 1. Intentar llamada real si está conectado
        if (this.connected && this.client) {
            try {
                console.log(`🔧 [REAL] Llamando ${toolName}`, args);
                const result = await this.client.callTool({
                    name: toolName,
                    arguments: args
                });
                return result;
            } catch (error) {
                console.error(`❌ Error en llamada real a ${toolName}:`, error);
                // Si falla la real, podríamos caer al fallback o lanzar error.
                // Por ahora lanzamos error para notar la falla de red/server
                throw error;
            }
        }

        // 2. Fallback a simulación
        console.log(`🔧 [SIMULACIÓN] Llamando ${toolName}`, args);
        const simulator = this.simulatedTools[server]?.[toolName];

        if (simulator) {
            // Un pequeño delay para realismo
            await new Promise(r => setTimeout(r, 600));
            return simulator(args);
        }

        throw new Error(`Herramienta no encontrada (ni real ni simulada): ${toolName}`);
    }

    // --- SIMULADORES (Misma lógica que antes para mantener funcionalidad) ---

    _simulateSearch(args) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify([
                    { name: 'Hostal Upano', type: 'lodging', rating: 4.5, vicinity: 'Centro' },
                    { name: 'Restaurante Selva Verde', type: 'restaurant', rating: 4.7, vicinity: 'Av.Amazonas' }
                ])
            }]
        };
    }

    _simulateRouting(args) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    duration: '50 min',
                    distance: '3.8 km',
                    steps: ['Salir del parque', 'Seguir Av. Principal']
                })
            }]
        };
    }

    _simulatePlaceDetails(args) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    name: args.placeId || 'Lugar Desconocido',
                    verified: true,
                    openNow: true
                })
            }]
        };
    }
}

export const mcpClient = new MCPClient();
