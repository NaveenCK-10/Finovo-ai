import express from 'express';
import { handleSingleChat, handleCollaborate } from '../controllers/chatController.js';
import { rateLimitByUser } from '../utils/rateLimiter.js';

const router = express.Router();

// Part 4.4 — Apply lightweight per-user rate limiter to all chat endpoints
router.post('/', rateLimitByUser, handleSingleChat);
router.post('/collaborate', rateLimitByUser, handleCollaborate);

export default router;
