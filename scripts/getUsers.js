import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

try {
    const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

    // Initialize without condition to ensure clean start in script
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    console.log(`Conectado al proyecto: ${serviceAccount.project_id}`);

    // Test Firestore connection
    const db = admin.firestore();
    try {
        const collections = await db.listCollections();
        console.log('✅ Conexión a Firestore exitosa. Colecciones:', collections.map(c => c.id));
    } catch (dbError) {
        console.error('❌ Error conectando a Firestore:', dbError.message);
    }

    const listAllUsers = async (nextPageToken) => {
        try {
            // List batch of users, 1000 at a time.
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

            console.log('--- USUARIOS ENCONTRADOS ---');
            listUsersResult.users.forEach((userRecord) => {
                console.log(`Email: ${userRecord.email} | UID: ${userRecord.uid} | Admin: ${userRecord.customClaims?.admin ? '✅' : '❌'}`);
            });

            if (listUsersResult.pageToken) {
                // List next batch of users.
                listAllUsers(listUsersResult.pageToken);
            } else {
                console.log('--- FIN DE LA LISTA ---');
                process.exit(0);
            }
        } catch (authError) {
            console.error('❌ Error listando usuarios (Auth):', authError);
            console.log('\n⚠️ POSIBLE CAUSA: "Authentication" no está habilitado en la consola de Firebase.');
            console.log('Por favor, ve a Build > Authentication y haz clic en "Comenzar".');
        }
    };

    listAllUsers();

} catch (error) {
    console.error('Error:', error);
}
