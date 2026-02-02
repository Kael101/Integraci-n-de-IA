/**
 * DATA: Puntos de Interés (POIs) para el Pasaporte Digital
 * Estos son los lugares físicos que el usuario debe visitar.
 */

export const PASSPORT_POIS = [
    {
        id: "poi_teatro_macas",
        name: "Teatro Washington Ricaurte",
        description: "El corazón cultural de Macas. Encuentra el código QR en la entrada principal.",
        coordinates: { lat: -2.308684, lng: -78.118947 }, // Coordenadas reales aprox
        qr_secret: "hash_teatro_2024_secure", // El contenido real del QR físico
        xp_value: 100,
        route_id: "RUTA_CULTURAL",
        image: "https://images.unsplash.com/photo-1516307365426-bea591f05011?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "poi_mirador_quilamo",
        name: "Mirador del Quilamo",
        description: "La mejor vista del valle del Upano. El QR está en el letrero informativo.",
        coordinates: { lat: -2.295000, lng: -78.110000 },
        qr_secret: "hash_quilamo_sky_view",
        xp_value: 200, // Más XP por ser difícil de llegar
        route_id: "RUTA_PANORAMICA",
        image: "https://images.unsplash.com/photo-1449824913929-4bba42b31615?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "poi_mercado_central",
        name: "Mercado Central",
        description: "Sabores de la Amazonía. Busca el QR en el puesto de información.",
        coordinates: { lat: -2.306000, lng: -78.120000 },
        qr_secret: "hash_mercado_flavors",
        xp_value: 100,
        route_id: "RUTA_GASTRONOMICA",
        image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: "poi_parque_botanico",
        name: "Parque Botánico",
        description: "Biodiversidad urbana. QR oculto cerca del orquideario.",
        coordinates: { lat: -2.315000, lng: -78.125000 },
        qr_secret: "hash_botanico_green",
        xp_value: 150,
        route_id: "RUTA_ECOLOGICA",
        image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=800&auto=format&fit=crop"
    }
];
