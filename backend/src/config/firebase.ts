import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import env from './env';

const initializeFirebase = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY;

  if (
    !projectId ||
    projectId === 'your-firebase-project-id' ||
    !clientEmail ||
    clientEmail === 'your-firebase-client-email' ||
    !privateKey ||
    privateKey === 'your-firebase-private-key'
  ) {
    throw new Error(
      '❌ Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing or placeholders. Server stopping.'
    );
  }

  // Format private key to handle escaped newline characters
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
};

export const firebaseApp = initializeFirebase();
export default firebaseApp;
