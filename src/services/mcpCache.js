/**
 * Servicio de Caché para Herramientas MCP - Territorio Jaguar
 * Permite persistir resultados de Google Maps y otros servidores para uso offline.
 */

const CACHE_PREFIX = 'tj_mcp_cache_';

export const McpCache = {
    /**
     * Guarda el resultado de una herramienta en la caché.
     * @param {string} toolName Nombre de la herramienta (ej: 'google_maps_search')
     * @param {object} params Parámetros de la consulta
     * @param {any} data Resultado a guardar
     */
    set: (toolName, params, data) => {
        const key = CACHE_PREFIX + toolName + '_' + btoa(JSON.stringify(params));
        const entry = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(key, JSON.stringify(entry));
        console.log(`[Offline Cache] Datos guardados para: ${toolName}`);
    },

    /**
     * Recupera datos de la caché local.
     * @param {string} toolName 
     * @param {object} params 
     * @returns {any|null}
     */
    get: (toolName, params) => {
        const key = CACHE_PREFIX + toolName + '_' + btoa(JSON.stringify(params));
        const item = localStorage.getItem(key);
        if (item) {
            const entry = JSON.parse(item);
            // Opcional: Validar expiración si es necesario (ej: 24h para Amazonía)
            return entry.data;
        }
        return null;
    }
};

export default McpCache;
