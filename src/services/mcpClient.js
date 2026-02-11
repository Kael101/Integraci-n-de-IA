import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/**
 * CLIENTE MCP - TERRITORIO JAGUAR
 * Gestiona la conexión con los servidores MCP (Google Maps y Firebase)
 * Utiliza el SDK oficial de MCP.
 */
class MCPClient {
    constructor() {
        this.clients = {}; // Map<serverName, Client>
        this.transports = {}; // Map<serverName, Transport>

        // Simulación
        this.simulatedTools = {
            'google-maps': {
                'google_maps_search': this._simulateSearch,
                'google_maps_routing': this._simulateRouting,
                'google_maps_place_details': this._simulatePlaceDetails
            },
            'ai-writer': {
                'enhance_description': this._simulateContentEnhancement
            }
        };
    }

    /**
     * Helper para logs controlados por entorno
     */
    _log(type, ...args) {
        // Solo loguear si estamos en modo desarrollo (Vite)
        if (import.meta.env.DEV) {
            if (type === 'warn') {
                console.warn(...args);
            } else {
                console.log(...args);
            }
        }
    }

    /**
     * Conectar a servidores MCP
     * @param {Object} servers - Mapa de nombre -> url. Ej: { 'maps': 'ws://...', 'memory': 'http://...' }
     */
    async connect(servers = { 'google-maps': 'ws://localhost:3000/mcp' }) {
        const results = {};

        for (const [name, url] of Object.entries(servers)) {
            try {
                this._log('info', `🔌 [${name}] Conectando a ${url}...`);
                const isSSE = url.startsWith('http');

                const transport = isSSE
                    ? new SSEClientTransport(new URL(url))
                    : new WebSocketClientTransport(new URL(url));

                const client = new Client({
                    name: "Territorio Jaguar Client",
                    version: "1.0.0",
                }, {
                    capabilities: { sampling: {} }
                });

                await client.connect(transport);

                this.clients[name] = client;
                this.transports[name] = transport;

                this._log('info', `✅ [${name}] Conectado via ${isSSE ? 'SSE' : 'WebSocket'}.`);
                results[name] = true;

            } catch (error) {
                this._log('warn', `⚠️ [${name}] Falló conexión a ${url}. Usando simulación si existe.`, error);
                results[name] = false;
            }
        }
        return results;
    }

    /**
     * Llamar a una herramienta MCP
     */
    async callTool(serverName, toolName, args) {
        const client = this.clients[serverName];

        // 1. Intentar llamada real
        if (client) {
            try {
                this._log('info', `🔧 [REAL] ${serverName}:${toolName}`, args);
                return await client.callTool({
                    name: toolName,
                    arguments: args
                });
            } catch (error) {
                console.error(`❌ Error en llamada real a ${toolName}:`, error);
                // Fallback a simulación si falla
            }
        }

        // 2. Fallback a simulación
        this._log('info', `🔧 [SIMULACIÓN] ${serverName}:${toolName}`, args);
        const simulator = this.simulatedTools[serverName]?.[toolName];

        if (simulator) {
            await new Promise(r => setTimeout(r, 600));
            return simulator(args);
        }

        throw new Error(`Herramienta no encontrada: ${serverName}:${toolName}`);
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

    _simulateContentEnhancement(args) {
        const originalText = args.text || "";
        const enhancements = [
            "🌿 Sumérgete en la naturaleza virgen.",
            "🐆 Territorio ancestral de biodiversidad.",
            "💧 Descubre cascadas cristalinas.",
            "📸 Perfecto para fotografía de vida silvestre."
        ];

        // Simple mock enhancement: Add intro, cleanup, add emojis and random hook
        const randomHook = enhancements[Math.floor(Math.random() * enhancements.length)];
        let improved = originalText.trim();

        // Fix capitalization
        if (improved.length > 0) {
            improved = improved.charAt(0).toUpperCase() + improved.slice(1);
        }

        // Add emojis if missing
        if (!improved.match(/[\u{1F600}-\u{1F6FF}]/u)) {
            improved = `✨ ${improved} 🍃`;
        }

        return {
            content: [{
                type: 'text',
                text: `${improved}\n\n${randomHook} Una experiencia inolvidable en el Valle del Upano.`
            }]
        };
    }
}

export const mcpClient = new MCPClient();
