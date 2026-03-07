// src/data/flora_shuar_waypoints.js
/**
 * FLORA SHUAR — WAYPOINTS GEORREFERENCIADOS
 * Territorio: Cuenca del Río Upano, Morona Santiago, Ecuador
 *
 * Cada entrada representa una especie sagrada / medicinal Shuar
 * con su ubicación GPS real en la región y metadatos etnobotánicos.
 * El radio de activación (triggerRadius) define la burbuja AR en metros.
 */

export const FLORA_SHUAR_WAYPOINTS = [
    {
        id: 'wp-001',
        lat: -2.3045,
        lng: -78.1172,
        triggerRadius: 80, // metros
        speciesShuar: 'Ayahuasca',
        speciesScientific: 'Banisteriopsis caapi',
        commonName: 'Ayahuasca / Yajé',
        category: 'sagrado',
        tagline: 'La Liana del Alma',
        description:
            'Planta maestra del chamanismo Shuar. Su corteza se cocina con otras plantas para preparar la bebida ceremonial usada en rituales de curación (Tsentsak) y conexión con el mundo espiritual (Arutam).',
        medicinalUse:
            'Tratamiento de enfermedades del espíritu, visiones diagnósticas, purificación del cuerpo energético.',
        mythology:
            'Los Shuar creen que Ayahuasca es el umbilical que conecta el mundo ordinario (Nunkui) con el plano de los ancestros (Arutam). Solo el Uwishin (chamán) puede guiar el viaje.',
        modelType: 'vine',
        color: '#7B2FBE',
        glowColor: '#C77DFF',
        icon: '🌿',
    },
    {
        id: 'wp-002',
        lat: -2.3180,
        lng: -78.1095,
        triggerRadius: 60,
        speciesShuar: 'Natem Wáa',
        speciesScientific: 'Psychotria viridis',
        commonName: 'Chacruna',
        category: 'sagrado',
        tagline: 'Compañera del Uwishin',
        description:
            'Arbusto de hojas persistentes que actúa como activador en la preparación de Natem. Sus hojas contienen DMT natural, considerado por los Shuar como el mensajero vegetal del espíritu.',
        medicinalUse:
            'Potenciador visionario ceremonial. En combinación con Ayahuasca activa las visiones terapéuticas.',
        mythology:
            'Según la cosmovisión Shuar, la Chacruna es la voz femenina que susurra al espíritu durante el viaje. Sin ella, la liana no puede hablar.',
        modelType: 'shrub',
        color: '#2D6A4F',
        glowColor: '#74C69D',
        icon: '🍃',
    },
    {
        id: 'wp-003',
        lat: -2.2920,
        lng: -78.1250,
        triggerRadius: 75,
        speciesShuar: 'Tsaank',
        speciesScientific: 'Datura arborea',
        commonName: 'Floripondio / Toe',
        category: 'medicinal',
        tagline: 'La Flor del Umbral',
        description:
            'Árbol de flores blancas trompetiformes. Planta de poder extremadamente potente, usada exclusivamente por chamanes expertos. Sus flores se usan en rituales de iniciación de guerreros Shuar.',
        medicinalUse:
            'Analgésico externo (hojas calentadas para dolores articulares). Internamente: solo bajo supervisión chamánica.',
        mythology:
            'El Tsaank es guardián del umbral entre la vida y la muerte. Los guerreros Shuar lo bebían en dosis minúsculas para alcanzar el estado Arutam (visión del guerrero) antes de una batalla.',
        modelType: 'tree',
        color: '#F8F9FA',
        glowColor: '#FFE5B4',
        icon: '🌸',
    },
    {
        id: 'wp-004',
        lat: -2.3310,
        lng: -78.1330,
        triggerRadius: 50,
        speciesShuar: 'Numi',
        speciesScientific: 'Cedrela odorata',
        commonName: 'Cedro Amazónico',
        category: 'sagrado',
        tagline: 'El Árbol de la Memoria',
        description:
            'Árbol maderero sagrado de gran porte. Para los Shuar, el cedro es hogar de espíritus de ancestros. Cortar un cedro sin permiso espiritual trae mala suerte a la familia.',
        medicinalUse:
            'Corteza: tratamiento de fiebres y malaria. Resina: cicatrizante de heridas profundas. Vapores de hoja: limpieza energética del hogar.',
        mythology:
            'El espíritu Numi protege la selva. Los curanderos piden permiso al árbol antes de cualquier corte ritual, ofrendando tabaco y chicha en sus raíces.',
        modelType: 'tree',
        color: '#8B5E3C',
        glowColor: '#D4A853',
        icon: '🌳',
    },
    {
        id: 'wp-005',
        lat: -2.3070,
        lng: -78.1410,
        triggerRadius: 65,
        speciesShuar: 'Ipiak',
        speciesScientific: 'Bixa orellana',
        commonName: 'Achiote',
        category: 'alimentario',
        tagline: 'La Pintura de los Guerreros',
        description:
            'Arbusto de frutos espinosos con semillas rojo-intenso. El achiote es el pigmento sagrado Shuar: se usa para pintar el cuerpo en rituales, celebraciones y como protección espiritual contra enfermedades.',
        medicinalUse:
            'Antipirético (hojas), antiinflamatorio, protector solar natural. Las semillas se usan para tratar quemaduras y erupciones cutáneas.',
        mythology:
            'El rojo del Ipiak simboliza la sangre de la tierra (Nunkui). Pintarse con achiote antes de cazar conecta al guerrero con la fuerza del jaguar.',
        modelType: 'shrub',
        color: '#E63946',
        glowColor: '#FF8FA3',
        icon: '🔴',
    },
    {
        id: 'wp-006',
        lat: -2.2865,
        lng: -78.1180,
        triggerRadius: 70,
        speciesShuar: 'Maikiua',
        speciesScientific: 'Brugmansia suaveolens',
        commonName: 'Maicoa / Guanto',
        category: 'medicinal',
        tagline: 'La Planta de la Iniciación',
        description:
            'Árbol de flores colgantes en forma de trompeta. Maikiua se usa en rituales de paso para jóvenes Shuar. La ingesta controlada por el chamán induce un estado de trance donde el iniciado "muere y renace" como adulto.',
        medicinalUse:
            'Externamente: analgésico para reumatismo. Internamente: exclusivo en contexto ritual bajo guía de Uwishin.',
        mythology:
            'Se dice que cuando una maikiua florece de noche, los espíritus de los ancestros vienen a escuchar sus historias. Sus flores caídas marcan el camino al mundo de los sueños.',
        modelType: 'tree',
        color: '#FFB703',
        glowColor: '#FFF3B0',
        icon: '🌼',
    },
];

/**
 * Helper: obtener waypoints por categoría
 */
export const getFloraByCategory = (category) =>
    FLORA_SHUAR_WAYPOINTS.filter((w) => w.category === category);

/**
 * Helper: waypoint por ID
 */
export const getFloraById = (id) =>
    FLORA_SHUAR_WAYPOINTS.find((w) => w.id === id) || null;
