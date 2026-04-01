import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'storage.json');

// In-process cache to optimize reads/writes
let dbData = null;

// Initial schema
const defaultSchema = {
  users: {},
  transactions: [],
  insights: [],
  chatHistory: [],
  financialProfile: null
};

class Database {
  async init() {
    try {
      try {
        await fs.access(DB_FILE);
        const data = await fs.readFile(DB_FILE, 'utf-8');
        dbData = JSON.parse(data);
        logger.info('Database loaded successfully from flat file');
      } catch (err) {
        if (err.code === 'ENOENT') {
          // File does not exist, initialize it
          dbData = { ...defaultSchema };
          await this.save();
          logger.info('Initialized new persistent database');
        } else {
          throw err;
        }
      }
    } catch (error) {
      logger.error('Failed to initialize database', error);
      // In worst case, default to empty schema memory
      dbData = { ...defaultSchema };
    }
  }

  async save() {
    try {
      if (dbData) {
        await fs.writeFile(DB_FILE, JSON.stringify(dbData, null, 2));
      }
    } catch (error) {
      logger.error('Failed to save to database', error);
    }
  }

  // Generic fast synchronous getters
  get(collection) {
    if (!dbData) return [];
    return dbData[collection] || [];
  }

  getObj(collection) {
    if (!dbData) return {};
    return dbData[collection] || {};
  }

  // Writes automatically trigger async save
  async push(collection, item) {
    if (!dbData) return;
    if (!dbData[collection]) dbData[collection] = [];
    dbData[collection].push(item);
    await this.save();
  }

  async set(collection, data) {
    if (!dbData) return;
    dbData[collection] = data;
    await this.save();
  }
}

export const db = new Database();
