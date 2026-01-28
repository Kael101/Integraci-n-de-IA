import { mcpClient } from '../services/mcpClient';

/**
 * AGENTE B: ESPECIALISTA EN GESTIÓN TURÍSTICA (SERVIDORES)
 * Responsable de servicios locales, logística y coordinación con Google Maps
 */

class TourismAgent {
    constructor() {
        this.name = "Agente Turismo";
        this.sunriseHour = 6; // 6 AM
        this.sunsetHour = 18; // 6 PM
    }

    /**
     * Inicializar servicios
     */
    async init() {
        await mcpClient.connect();
    }

    /**
     * Obtener recomendaciones de rutas con validación de horario solar
     */
    async getRouteRecommendations(location) {
        try {
            await this.init(); // Asegurar conexión

            // 1. Obtener ruta sugerida via MCP
            const mcpResponse = await mcpClient.callTool('google-maps', 'google_maps_routing', {
                origin: location, // Asumiendo que location es "lat,lng" o nombre
                destination: "Mirador del Upano", // Default por ahora, o lógica dinámica
                mode: "walking"
            });

            // Parsear respuesta del MCP (asumiendo estructura JSON en text content)
            const rawData = mcpResponse.content[0].text;
            const routeData = JSON.parse(rawData);

            const route = {
                name: "Ruta: " + (routeData.summary || "Mirador del Upano"),
                duration: routeData.duration,
                distance: routeData.distance,
                startTime: new Date()
            };

            // Validar horario solar
            const isDaylight = this.validateDaylight(route.startTime, route.duration);

            // Buscar servicios cercanos
            const services = await this.findNearbyServices(location);

            return {
                route: route.name,
                duration: route.duration,
                distance: route.distance,
                daylight: isDaylight,
                services: services.map(s => s.name),
                serviceDetails: services
            };

        } catch (error) {
            console.error("Error getting route recommendations:", error);
            return {
                route: "Ruta no disponible",
                duration: "N/A",
                daylight: false,
                services: []
            };
        }
    }

    /**
     * Buscar servicios cercanos con métodos de pago electrónicos
     */
    async findNearbyServices(location) {
        try {
            await this.init();

            const response = await mcpClient.callTool('google-maps', 'google_maps_search', {
                query: "restaurantes y hoteles",
                location: location,
                radius: 1000
            });

            const rawData = response.content[0].text;
            const places = JSON.parse(rawData);

            return places.map(place => ({
                name: place.name,
                type: place.type || "lugar",
                rating: place.rating || 0,
                distance: place.vicinity || "cerca"
            }));

        } catch (error) {
            console.error("Error finding services:", error);
            return [];
        }
    }

    /**
     * Validar que la ruta se complete dentro del horario solar
     */
    validateDaylight(startTime, durationStr) {
        const durationMinutes = parseInt(durationStr);
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

        const startHour = startTime.getHours();
        const endHour = endTime.getHours();

        return startHour >= this.sunriseHour && endHour <= this.sunsetHour;
    }

    /**
     * Calcular logística de viaje (usado por MCP calculate_logistics)
     */
    async calculateLogistics(origin, destination) {
        try {
            const response = await mcpClient.callTool('google-maps', 'google_maps_routing', {
                origin,
                destination
            });
            const data = JSON.parse(response.content[0].text);

            return {
                duration: data.duration,
                distance: data.distance,
                steps: data.steps || [],
                warnings: ["Verificar clima antes de salir"]
            };
        } catch (e) {
            console.error("Logistics error", e);
            return { duration: "N/A", distance: "N/A", steps: [] };
        }
    }
    /**
     * Verificar detalles de un lugar específico
     */
    async verifyPlace(placeId) {
        try {
            const response = await mcpClient.callTool('google-maps', 'google_maps_place_details', { placeId });
            const data = JSON.parse(response.content[0].text);
            return data;
        } catch (e) {
            return { verified: false };
        }
    }
}

export const tourismAgent = new TourismAgent();
