/**
 * setRoles.js
 * Script local para asignar Custom Claims (Roles) a usuarios en Firebase Auth.
 * 
 * USO:
 * 1. Desde la Consola de Firebase: Configuración del Proyecto > Cuentas de Servicio
 * 2. Genera una nueva clave privada (archivo .json)
 * 3. Guarda ese archivo en la raíz de tu proyecto como 'serviceAccountKey.json' (¡Asegúrate que esté en tu .gitignore!)
 * 4. Ejecuta: npm install firebase-admin (si no lo tienes instalado localmente)
 * 5. Ejecuta: node setRoles.js
 */

const admin = require("firebase-admin");
const fs = require('fs');
const path = require('path');

// 1. Configuración de Credenciales
const KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(KEY_PATH)) {
  console.error(`
❌ ERROR CATASTRÓFICO: No se encontró el archivo de credenciales.
Por favor, descarga tu clave privada desde Firebase y guárdala como:
${KEY_PATH}

⚠️ ¡IMPORTANTE: Asegúrate de añadir serviceAccountKey.json a tu .gitignore!
  `);
  process.exit(1);
}

const serviceAccount = require(KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// --- CONFIGURACIÓN DE ROLES ---

// Agrega aquí los UID de los usuarios que quieres promover.
// El UID lo obtienes de la pestaña "Authentication" en la consola de Firebase.
const USERS_TO_UPDATE = [
  {
    uid: "REEMPLAZAR_CON_UID_DEL_GUIA_AQUI", // Ejemplo: "aB3dE...8z1"
    role: "guia",
    email: "guia@ejemplo.com" // Opcional, solo para los logs
  },
  // {
  //   uid: "REEMPLAZAR_CON_UID_DEL_ADMIN_AQUI",
  //   role: "admin",
  //   email: "admin@territoriojaguar.com"
  // }
];

// --- LÓGICA DE ASIGNACIÓN ---

async function assignRoles() {
  console.log("Iniciando asignación de roles...\n");
  
  for (const user of USERS_TO_UPDATE) {
    if (user.uid.startsWith("REEMPLAZAR")) {
        console.log(`⚠️  Saltando usuario de ejemplo (${user.role}). Por favor, configura un UID válido.`);
        continue;
    }

    try {
      // 1. Asignar el Custom Claim en Firebase Auth
      await admin.auth().setCustomUserClaims(user.uid, { role: user.role });
      console.log(`✅ Claim Auth: Rol '${user.role}' asignado a UID: ${user.uid} (${user.email || 'Sin email'})`);
      
      // 2. Opcional pero recomendado: Replicar el rol en Firestore
      // Esto facilita leer el rol desde el frontend sin tener que decodificar el token JWT
      const db = admin.firestore();
      await db.collection('usuarios').doc(user.uid).set(
        { 
          isGuide: user.role === 'guia' || user.role === 'admin', 
          role: user.role,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, 
        { merge: true } // Merge evita sobrescribir otros datos del perfil
      );
      console.log(`✅ Doc Firestore: Colección 'usuarios' actualizada para UID: ${user.uid}`);
      
    } catch (error) {
      console.error(`❌ Error asignando rol a UID: ${user.uid}. Detalles:`, error);
    }
  }

  console.log("\nProceso finalizado.");
  process.exit(0);
}

// Ejecutar el script
assignRoles();
