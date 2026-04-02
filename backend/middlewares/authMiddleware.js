import admin from 'firebase-admin';
import logger from '../utils/logger.js';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * 🛡️ Security Auth Middleware
 * Verifies Firebase ID Token securely avoiding repeated rigorous checks.
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing Token" });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Pass verified user downward
    next();
  } catch (error) {
    logger.error('Token verification failed inside middleware', error);
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid Token" });
  }
};
