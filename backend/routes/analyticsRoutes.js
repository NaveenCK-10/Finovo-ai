import express from 'express';
import { db } from '../database/db.js';
import { successResponse } from '../utils/responseHandler.js';

const router = express.Router();

/**
 * 📈 Advanced Analytics API
 * Extracts insights, system load, and trend stats from historical interactions without
 * heavily impacting active UI thread performance.
 */
router.get('/insights', async (req, res) => {
  try {
    const historicalChats = db.get('chatHistory') || [];
    const generatedInsights = db.get('insights') || [];
    
    // Calculate Agent Utilization
    const agentStats = historicalChats.reduce((acc, curr) => {
      const agent = curr.agent || 'Unknown';
      acc[agent] = (acc[agent] || 0) + 1;
      return acc;
    }, {});

    // Compute System Uptime & Interactions Velocity
    const stats = {
      totalQueriesProcessed: historicalChats.length,
      deepInsightsGenerated: generatedInsights.length,
      agentUtilization: Object.entries(agentStats).map(([name, queries]) => ({ name, queries })),
      serverUptimeMs: Math.floor(process.uptime() * 1000),
      analyticsSnapshotTime: new Date().toISOString()
    };

    return successResponse(res, stats);
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to generate analytics insight" });
  }
});

export default router;
