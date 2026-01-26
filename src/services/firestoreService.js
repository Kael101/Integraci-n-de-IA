// src/services/firestoreService.js
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * SERVICIO DE FIRESTORE - TERRITORIO JAGUAR
 * Gestión centralizada de las operaciones de base de datos
 */

// ==================== COLECCIÓN: SOCIOS (Providers) ====================

/**
 * Obtener todos los socios/comercios afiliados
 */
export const getAllProviders = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "socios"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching providers:", error);
        return [];
    }
};

/**
 * Agregar un nuevo socio
 */
export const addProvider = async (providerData) => {
    try {
        const docRef = await addDoc(collection(db, "socios"), {
            ...providerData,
            createdAt: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error adding provider:", error);
        return { success: false, error };
    }
};

// ==================== COLECCIÓN: RUTAS ====================

/**
 * Obtener todas las rutas turísticas
 */
export const getAllRoutes = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "rutas"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching routes:", error);
        return [];
    }
};

/**
 * Agregar una nueva ruta
 */
export const addRoute = async (routeData) => {
    try {
        const docRef = await addDoc(collection(db, "rutas"), {
            ...routeData,
            createdAt: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error adding route:", error);
        return { success: false, error };
    }
};

// ==================== COLECCIÓN: PRODUCTOS ====================

/**
 * Obtener todos los productos del marketplace
 */
export const getAllProducts = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

/**
 * Agregar un nuevo producto
 */
export const addProduct = async (productData) => {
    try {
        const docRef = await addDoc(collection(db, "productos"), {
            ...productData,
            createdAt: new Date().toISOString()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error adding product:", error);
        return { success: false, error };
    }
};
