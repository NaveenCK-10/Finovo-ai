import express from 'express';
import { handleSingleChat, handleCollaborate } from '../controllers/chatController.js';
import { rateLimitByUser } from '../utils/rateLimiter.js';

import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Part 4.4 — Apply lightweight per-user rate limiter to all chat endpoints
// 🛡️ Security Auth injected globally across chat routes before processing
router.use(requireAuth);
router.post('/', rateLimitByUser, handleSingleChat);
router.post('/collaborate', rateLimitByUser, handleCollaborate);

export default router;
