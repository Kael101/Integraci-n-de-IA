// src/utils/migrateToFirestore.js
import { addProvider, addRoute, addProduct } from '../services/firestoreService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import providersData from '../data/providers.json';
import { rutaUpano } from '../data/ruta_upano';

/**
 * SCRIPT DE MIGRACIÓN: JSON LOCAL → FIRESTORE
 * Ejecutar una sola vez para poblar la base de datos inicial
 */

export const migrateProviders = async () => {
    console.log("🔄 Iniciando migración de Socios...");

    for (const provider of providersData.features) {
        const providerDoc = {
            name: provider.properties.name,
            category: provider.properties.category,
            thumbnail: provider.properties.thumbnail,
            rating: provider.properties.rating,
            coordinates: {
                lng: provider.geometry.coordinates[0],
                lat: provider.geometry.coordinates[1]
            }
        };

        const result = await addProvider(providerDoc);
        if (result.success) {
            console.log(`✅ Socio agregado: ${providerDoc.name}`);
        } else {
            console.error(`❌ Error: ${providerDoc.name}`, result.error);
        }
    }

    console.log("✅ Migración de Socios completada");
};

export const migrateRoutes = async () => {
    console.log("🔄 Iniciando migración de Rutas...");

    for (const feature of rutaUpano.features) {
        const routeDoc = {
            name: feature.properties.name,
            difficulty: feature.properties.difficulty,
            duration: feature.properties.duration,
            distance: feature.properties.distance,
            description: feature.properties.description,
            geometry: feature.geometry
        };

        const result = await addRoute(routeDoc);
        if (result.success) {
            console.log(`✅ Ruta agregada: ${routeDoc.name}`);
        } else {
            console.error(`❌ Error: ${routeDoc.name}`, result.error);
        }
    }

    console.log("✅ Migración de Rutas completada");
};

export const migrateProducts = async () => {
    console.log("🔄 Iniciando migración de Productos...");

    const demoProducts = [
        {
            name: "Jungle Protein Bites",
            producer: "Nutrición Amazónica",
            category: "Gastronomía",
            price: 12.50,
            rating: 4.9,
            image: "https://images.unsplash.com/photo-1599599810653-98fe80fa464e?q=80&w=800&auto=format&fit=crop",
            isNew: true,
            tag: "Superalimento"
        },
        {
            name: "Collar Étnico Shuar",
            producer: "Asoc. Mujeres Artesanas",
            category: "Artesanía",
            price: 25.00,
            rating: 4.8,
            image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=800&auto=format&fit=crop",
            isNew: false
        },
        {
            name: "Chocolate 85% Macas",
            producer: "Finca El Origen",
            category: "Gastronomía",
            price: 8.00,
            rating: 5.0,
            image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?q=80&w=800&auto=format&fit=crop",
            isNew: false
        }
    ];

    for (const product of demoProducts) {
        const result = await addProduct(product);
        if (result.success) {
            console.log(`✅ Producto agregado: ${product.name}`);
        } else {
            console.error(`❌ Error: ${product.name}`, result.error);
        }
    }

    console.log("✅ Migración de Productos completada");
};

export const migrateDetections = async () => {
    console.log("🔄 Iniciando migración de Detecciones IA...");

    const now = new Date();
    const demoDetections = [
        {
            sector: "sector_abanico",
            especie: "Panthera onca",
            individuoId: "Macho Alfa",
            timestamp: new Date(now - 45 * 60000).toISOString(), // Hace 45 minutos
            comportamiento: "caminando",
            velocidad: "normal",
            vocalizacion: false,
            confianza: 0.96,
            coordenadas: { lng: -78.1182, lat: -2.3050 }
        },
        {
            sector: "sector_abanico",
            especie: "Panthera onca",
            individuoId: "Hembra Juvenil",
            timestamp: new Date(now - 3 * 3600000).toISOString(), // Hace 3 horas
            comportamiento: "corriendo",
            velocidad: "rápida",
            vocalizacion: false,
            confianza: 0.89,
            coordenadas: { lng: -78.1175, lat: -2.3065 }
        },
        {
            sector: "sector_cascada",
            especie: "Panthera onca",
            individuoId: "Macho Alfa",
            timestamp: new Date(now - 12 * 3600000).toISOString(), // Hace 12 horas
            comportamiento: "marcando_territorio",
            velocidad: "lenta",
            vocalizacion: true,
            confianza: 0.94,
            coordenadas: { lng: -78.1200, lat: -2.3100 }
        }
    ];

    for (const detection of demoDetections) {
        try {
            await addDoc(collection(db, "detecciones_ia"), detection);
            console.log(`✅ Detección agregada: ${detection.individuoId} en ${detection.sector}`);
        } catch (error) {
            console.error(`❌ Error: ${detection.individuoId}`, error);
        }
    }

    console.log("✅ Migración de Detecciones IA completada");
};

/**
 * Ejecutar todas las migraciones
 */
export const runAllMigrations = async () => {
    console.log("🚀 INICIANDO MIGRACIÓN COMPLETA A FIRESTORE");
    await migrateProviders();
    await migrateRoutes();
    await migrateProducts();
    await migrateDetections();
    console.log("🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!");
};
