/**
 * DEFINICIÓN DE RUTA: MURALES VIVOS (MORONA SANTIAGO)
 * 5 Estaciones Emblemáticas con narrativa de agentes y activadores AR.
 */

export const muralesRoute = [
    {
        id: "estacion-1-teatro",
        name: "Teatro Washington Ricaurte",
        subtitle: "El Inicio - Portal Cultural",
        location: { lat: -2.308684, lng: -78.118947 }, // Coordenadas aprox Macas Centro
        triggerRadius: 20, // metros
        agent: "Orchestrator",
        arEffect: "dance_shuar",
        dialogue: {
            speaker: "Orquestador",
            text: "¡Bienvenido, Aliado! Tus coordenadas confirman que estás frente al corazón cultural de Macas: el Teatro Washington Ricaurte. No solo estás viendo una pared; estás frente a un portal. Activa tu escáner AR para despertar la 'Escena Ancestral'. Al hacerlo, tu rango de explorador se activará oficialmente.",
            audioUrl: "/assets/audio/station1_intro.mp3" // Placeholder
        },
        arContent: {
            title: "Danza de la Culebra",
            description: "Representación 3D de la fuerza del agua.",
            agentNote: "Esta danza representa la fuerza del agua y el respeto a los depredadores de la selva. Escucha el tambor, es el latido del Upano."
        }
    },
    {
        id: "estacion-2-parque",
        name: "Parque Recreacional",
        subtitle: "Ciencia Viva",
        location: { lat: -2.312000, lng: -78.120000 }, // Placeholder
        triggerRadius: 25,
        agent: "Tourism",
        arEffect: "animals_run",
        dialogue: {
            speaker: "Agente Turismo",
            text: "Este parque no es solo para humanos. Los datos de la IA indican que hace décadas, este era un corredor de paso real. Al jugar aquí, apoyas a que la selva recupere su espacio.",
            audioUrl: "/assets/audio/station2_intro.mp3"
        },
        arContent: {
            title: "Corre con el Jaguar",
            description: "Animales digitales interactivos en el césped.",
            agentNote: "Intenta tocar a los tapires digitales, ¡reaccionan a tu presencia!"
        }
    },
    {
        id: "estacion-3-piscinas",
        name: "Piscinas Municipales",
        subtitle: "Ciclo Hídrico",
        location: { lat: -2.305000, lng: -78.115000 }, // Placeholder
        triggerRadius: 20,
        agent: "Field",
        arEffect: "water_flow",
        dialogue: {
            speaker: "Agente Guía (Campo)",
            text: "El agua que ves aquí es la misma que bebe el jaguar kilómetros selva adentro. Si el agua está sana, el felino prospera.",
            audioUrl: "/assets/audio/station3_intro.mp3"
        },
        arContent: {
            title: "Flujo del Upano",
            description: "Visualización de datos de pureza del agua.",
            agentNote: "Las partículas de color representan datos reales de la limpieza del río."
        }
    },
    {
        id: "estacion-4-corte",
        name: "Corte Provincial",
        subtitle: "Justicia Natural",
        location: { lat: -2.307500, lng: -78.117500 }, // Placeholder
        triggerRadius: 15,
        agent: "Biocommerce", // Usamos este para Artesanos/Cultura
        arEffect: "justice_scales",
        dialogue: {
            speaker: "Agente Artesanos",
            text: "La justicia no es solo para nosotros. Aquí en Morona Santiago, el jaguar es un ciudadano con derechos. Tu respeto a la ley nos permite seguir creando arte inspirado en su belleza.",
            audioUrl: "/assets/audio/station4_intro.mp3"
        },
        arContent: {
            title: "Balanza de la Naturaleza",
            description: "Equilibrio entre comunidad y fauna.",
            agentNote: "Observa cómo la balanza encuentra el equilibrio perfecto."
        }
    },
    {
        id: "estacion-5-logrono",
        name: "Cantón Logroño",
        subtitle: "El Puente Territorial",
        location: { lat: -2.620000, lng: -78.170000 }, // Logroño aprox
        triggerRadius: 50, // Radio más amplio por ser llegada
        agent: "Orchestrator",
        arEffect: "golden_path",
        dialogue: {
            speaker: "Orquestador",
            text: "¡Misión cumplida! Has recorrido los nodos de nuestra identidad. Has demostrado ser un verdadero Guardián del Territorio.",
            audioUrl: "/assets/audio/station5_intro.mp3"
        },
        arContent: {
            title: "El Rastro del Jaguar",
            description: "Mapa holográfico de conexión territorial.",
            agentNote: "Has desbloqueado el Cofre del Guardián."
        },
        reward: {
            type: "nft_badge",
            preview: "Sello Oro - Guardián",
            code: "JAGUAR-GOLD-2026"
        }
    }
];
