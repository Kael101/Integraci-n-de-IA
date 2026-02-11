
export const mockRoutes = [
    {
        "id": "1",
        "title": "Cascada Kintia Panki",
        "provider": "Asociación Shuar",
        "type": "Natural",
        "difficulty": "Medium",
        "coordinates": { "lat": -2.31, "lng": -78.12 },
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Cascada_de_Kintia_Panki.jpg/800px-Cascada_de_Kintia_Panki.jpg",
        "is_verified": true,
        "status": "APPROVED"
    },
    {
        "id": "2",
        "title": "Cueva de los Tayos",
        "provider": "Comunidad Coangos",
        "type": "Aventura",
        "difficulty": "Hard",
        "coordinates": { "lat": -3.05, "lng": -78.22 },
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e3/Cueva_de_los_Tayos.jpg",
        "is_verified": true,
        "status": "APPROVED"
    },
    {
        "id": "3",
        "title": "Mirador del Quilamo",
        "provider": "Turismo Macas",
        "type": "Panorámico",
        "difficulty": "Easy",
        "coordinates": { "lat": -2.30, "lng": -78.11 },
        "image_url": "https://live.staticflickr.com/65535/51234567890_abcdef1234_b.jpg", // Placeholder
        "is_verified": true,
        "status": "PENDING"
    }
];

export const fetchRoutes = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockRoutes);
        }, 1000);
    });
};
