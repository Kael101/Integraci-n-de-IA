/**
 * @typedef {Object} ProviderProperties
 * @property {string} name - Nombre del artesano o negocio.
 * @property {string} nameNative - Nombre en Shuar/Achuar.
 * @property {'gastronomy' | 'artisan' | 'lodging' | 'guide'} category - Categoría del servicio.
 * @property {string} thumbnail_url - URL de la imagen principal.
 * @property {string} [blurhash] - Hash para el placeholder elegante (opcional).
 * @property {number} [rating] - Calificación del proveedor.
 */

/**
 * @typedef {Object} ProviderFeature
 * @property {string} id - Identificador único.
 * @property {'Feature'} type - Tipo de Feature GeoJSON.
 * @property {Object} geometry - Geometría del punto.
 * @property {'Point'} geometry.type - Tipo de punto.
 * @property {[number, number]} geometry.coordinates - Coordenadas obligatorias [longitude, latitude].
 * @property {ProviderProperties} properties - Metadatos del proveedor.
 */

export { };
