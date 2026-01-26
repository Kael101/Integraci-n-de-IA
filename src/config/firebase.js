// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

/**
 * CONFIGURACIÓN DE FIREBASE - TERRITORIO JAGUAR
 * Proyecto: territorio-jaguar
 * Conectado a Firestore, Auth y Analytics
 */
const firebaseConfig = {
    apiKey: "AIzaSyD8WIohR2IjnXd0qMP8E2ttmB0h7UMeBQY",
    authDomain: "territorio-jaguar.firebaseapp.com",
    projectId: "territorio-jaguar",
    storageBucket: "territorio-jaguar.firebasestorage.app",
    messagingSenderId: "628995955087",
    appId: "1:628995955087:web:2ab886cc920eae685fd3fa",
    measurementId: "G-BJYB6FPKJY"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, auth, analytics };
