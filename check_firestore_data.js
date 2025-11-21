require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = getFirestore(admin.app(), 'skatez');

async function checkData() {
    const snapshot = await db.collection('images').limit(1).get();
    snapshot.forEach(doc => {
        console.log('Data:', doc.data());
        console.log('Uploaded Type:', typeof doc.data().uploaded);
        console.log('Uploaded Constructor:', doc.data().uploaded.constructor.name);
    });
}

checkData();
