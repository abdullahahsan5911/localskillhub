import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Firebase Admin is initialized lazily so the server always starts.
// If credentials are missing or invalid, OAuth calls will return a
// clear error instead of crashing the process on boot.

let _auth = null;
let _initError = null;

function getFirebaseAuth() {
  if (_auth) return _auth;
  if (_initError) throw _initError;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY ||
      FIREBASE_PRIVATE_KEY.includes('<paste_key_here>')) {
    _initError = new Error(
      'Firebase Admin credentials are not configured. ' +
      'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env. ' +
      'Download a service account JSON from Firebase Console → Project Settings → Service Accounts.'
    );
    throw _initError;
  }

  try {
    const existingApp = admin.apps.length ? admin.apps[0] : null;
    const app = existingApp || admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Replace literal \n sequences with real newlines
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    _auth = app.auth();
    return _auth;
  } catch (err) {
    _initError = new Error(`Firebase Admin initialization failed: ${err.message}`);
    throw _initError;
  }
}

// Export a proxy object so import syntax stays the same in auth.js
export const firebaseAuth = {
  verifyIdToken: (token) => getFirebaseAuth().verifyIdToken(token),
};

export default admin;
