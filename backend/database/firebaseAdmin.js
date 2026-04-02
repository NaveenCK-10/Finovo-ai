import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// We initialize default app without explicit credentials.
// In a true production environment with GCP, it magically works via Application Default Credentials.
// If needed, we catch errors and handle initialization gracefully.
let fbAdminDb = null;
try {
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project'
    });
  }
  fbAdminDb = getFirestore();
} catch (error) {
  console.warn("Firebase Admin init error (Demo mode fallback):", error.message);
}

export const adminDb = fbAdminDb;
