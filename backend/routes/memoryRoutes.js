import express from 'express';
import { db } from '../database/db.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /api/memory -> load persistent user state on startup
router.get('/', async (req, res) => {
  try {
    const memoryPayload = {
      transactions: db.get('transactions'),
      insights: db.get('insights').slice(-10),     // return last 10
      chatHistory: db.get('chatHistory').slice(-20), // return last 20
      financialProfile: db.getObj('financialProfile')
    };
    logger.info('Memory loaded and sent to client');
    return successResponse(res, memoryPayload);
  } catch (error) {
    logger.error('Error serving persistent memory', error);
    return errorResponse(res, 'Failed to retrieve persistent memory', 500);
  }
});

// POST /api/memory/sync -> persist updated insights/profile
router.post('/sync', async (req, res) => {
  try {
    const { insights, chatHistory, financialProfile } = req.body;
    
    // Validate and push new insights if present
    if (insights && Array.isArray(insights)) {
      for (const inv of insights) {
        // Skip inserts if duplicate text could be an issue, naive push for now
        await db.push('insights', inv);
      }
    }
    
    if (financialProfile) {
      await db.set('financialProfile', financialProfile);
    }

    return successResponse(res, { message: 'Memory successfully synced' });
  } catch (error) {
    return errorResponse(res, 'Failed to sync memory', 500);
  }
});

export default router;
