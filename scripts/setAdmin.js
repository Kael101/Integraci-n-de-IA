import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// CONFIGURACIÓN
// 1. Descarga tu Service Account Key desde:
//    Configuración del Proyecto > Cuentas de servicio > Generar nueva clave privada
// 2. Guarda el archivo como 'serviceAccountKey.json' en la raíz del proyecto o en la carpeta scripts
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

if (process.argv.length < 3) {
    console.error('❌ Error: Debes proporcionar el UID del usuario.');
    console.error('Uso: node scripts/setAdmin.js <UID_DEL_USUARIO>');
    process.exit(1);
}

const targetUid = process.argv[2];

try {
    const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    const db = admin.firestore();

    console.log(`🔄 Asignando rol de ADMIN al usuario: ${targetUid}...`);

    const userRef = db.collection('users').doc(targetUid);

    // Verificar si el usuario existe
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        // Opción: Crear el usuario si no existe (solo el documento en Firestore)
        console.log("⚠️ El usuario no tiene documento en Firestore. Creándolo...");
        await userRef.set({
            role: 'admin',
            createdAt: new Date().toISOString(),
            // Puedes añadir más campos iniciales si es necesario
        });
    } else {
        // Actualizar existente
        await userRef.update({
            role: 'admin'
        });
    }

    console.log(`✅ ¡ÉXITO! El usuario ${targetUid} ahora es ADMINISTRADOR.`);
    console.log('Recuerda: Las nuevas reglas de seguridad permitirán a este usuario editar todo.');

} catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ENOENT') {
        console.error('⚠️ No se encontró el archivo serviceAccountKey.json. Asegúrate de descargarlo de Firebase Console.');
    }
}
