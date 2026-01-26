// src/agents/biocommerceAgent.js
/**
 * AGENTE C: ESPECIALISTA EN BIOCOMERCIO (ARTESANOS)
 * Responsable del marketplace, storytelling y conexión artesano-turista
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';

class BiocommerceAgent {
    constructor() {
        this.name = "Agente Biocomercio";
        this.storytelling = {
            // Narrativas pre-escritas por artesano
            "jungle_protein_bites": "Creado por María Chumpi, nutricionista Shuar. Cada venta financia 1 cámara trampa durante 1 mes.",
            "collar_etnico": "Tejido a mano por la Asociación de Mujeres Artesanas. El 30% de cada venta va al fondo de conservación.",
            "chocolate_macas": "Cacao orgánico de Finca El Origen. Cada barra protege 10m² de selva primaria."
        };
    }

    /**
     * Obtener catálogo de productos con storytelling
     */
    async getCatalog(category = null) {
        try {
            let q = collection(db, "productos");

            if (category) {
                q = query(q, where("category", "==", category));
            }

            const snapshot = await getDocs(q);
            const products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Enriquecer con storytelling
            const enrichedProducts = products.map(product => ({
                ...product,
                story: this.getStoryForProduct(product),
                conservationImpact: this.calculateImpact(product.price)
            }));

            return {
                products: enrichedProducts,
                storytelling: this.storytelling,
                totalProducts: products.length
            };

        } catch (error) {
            console.error("Error getting catalog:", error);
            return {
                products: [],
                storytelling: {},
                totalProducts: 0
            };
        }
    }

    /**
     * Obtener historia del artesano para un producto
     */
    getStoryForProduct(product) {
        const productKey = product.name.toLowerCase().replace(/\s+/g, '_');
        return this.storytelling[productKey] ||
            `Producto artesanal que apoya la conservación del jaguar en Morona Santiago.`;
    }

    /**
     * Calcular impacto de conservación por compra
     */
    calculateImpact(price) {
        // Fórmula: cada $10 = 1 mes de monitoreo
        const months = Math.floor(price / 10);

        if (months === 0) return "Contribuye al fondo de conservación";
        if (months === 1) return "Financia 1 mes de monitoreo con IA";
        return `Financia ${months} meses de monitoreo con IA`;
    }

    /**
     * Verificar disponibilidad de producto
     */
    async checkAvailability(productId) {
        try {
            const q = query(
                collection(db, "productos"),
                where("__name__", "==", productId)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { available: false, reason: "Producto no encontrado" };
            }

            const product = snapshot.docs[0].data();

            return {
                available: product.stock > 0,
                stock: product.stock || "Disponible",
                estimatedDelivery: "3-5 días hábiles a Sevilla Don Bosco"
            };

        } catch (error) {
            console.error("Error checking availability:", error);
            return { available: false, reason: "Error técnico" };
        }
    }

    /**
     * Generar recomendación personalizada
     */
    getPersonalizedRecommendation(userProfile) {
        const recommendations = {
            "eco_conscious": "jungle_protein_bites",
            "culture_lover": "collar_etnico",
            "foodie": "chocolate_macas"
        };

        const productKey = recommendations[userProfile.interest] || "collar_etnico";

        return {
            productKey,
            reason: `Basado en tu interés en ${userProfile.interest}, te recomendamos este producto.`,
            story: this.storytelling[productKey]
        };
    }
}

export const biocommerceAgent = new BiocommerceAgent();
