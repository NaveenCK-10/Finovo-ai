import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { db } from './database/db.js';

import chatRoutes from './routes/chatRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';

import * as functions from 'firebase-functions';

dotenv.config();

const app = express();

// Allow the custom x-user-uid header used for backend trust identification
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-uid'],
}));
app.use(express.json());

// Global structured request logging middleware
app.use(logger.request);

// Modular Routes
app.use('/api/chat', chatRoutes);    // Use standardize responses, modular agents
app.use('/api/memory', memoryRoutes); // Persistent database load/save

// Health check returns standardized format as well
app.use('/health', (req, res) => {
  res.json({
    success: true,
    data: { status: 'online', uptime: process.uptime() },
    error: null
  });
});

// Initialize database
await db.init().catch(err => {
  logger.error('Failed to initialize database', err);
});

// Export the Firebase Function
export const api = functions.https.onRequest(app);
