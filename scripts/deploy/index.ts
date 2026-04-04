import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { MissionStateSchema } from '../../domains/shared/schemas/src/mission';
import { RedisClient } from '../../domains/shared/redis-client/src/index';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Initialize Redis connection (The Warp Core)
const redis = RedisClient.getInstance();

// Initialize Supabase for persistent mission lookups
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

app.use(cors());
app.use(express.json());

// Trust proxy if behind Nginx (allows correct IP detection for rate limiting)
app.set('trust proxy', 1);

// Rate Limiter: Prevent aggressive dashboard polling from overloading databases
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use(limiter);

// Dark Forest Protocol: Shared Secret Auth
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const secret = req.headers['x-gateway-secret'];
  if (!secret || secret !== process.env.API_AUTH_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: Protocol Violation' });
  }
  next();
};

// 1. Health Check
app.get('/health', async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'healthy', redis: 'connected', timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(503).json({ status: 'unhealthy', redis: 'disconnected', error: error.message });
  }
});

// 2. Redis Cache Statistics
app.get('/api/cache/stats', authMiddleware, async (req, res) => {
  try {
    const info = await redis.info('memory');
    const dbSize = await redis.dbsize();
    
    // Extract human-readable memory usage
    const usedMemory = info.split('\n')
      .find(line => line.startsWith('used_memory_human'))
      ?.split(':')[1].trim();

    res.json({
      active_keys: dbSize,
      memory_usage: usedMemory,
      connected_clients: await redis.get('system:active_agents') || 0,
      environment: process.env.ENVIRONMENT || 'development'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve Warp Core metrics', details: error.message });
  }
});

// 3. Mission Status Lookup
app.get('/api/missions/:projectId', authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  
  try {
    // First check hot cache in Redis
    const cachedState = await redis.get(`project:${projectId}:mission_state`);

    if (cachedState) {
      const data = JSON.parse(cachedState);
      // Validate the data against the MissionStateSchema
      const result = MissionStateSchema.safeParse(data);

      if (result.success) {
        return res.json(result.data);
      }
      console.error(`[Gateway] Corrupt mission state in Redis for ${projectId}:`, result.error.format());
      // Continue to Supabase fallback if Redis data is invalid
    }

    // Fallback to Supabase (The Vault)
    console.log(`[Gateway] Redis miss or corruption for ${projectId}, checking Supabase...`);
    const { data: dbState, error: dbError } = await supabase
      .from('mission_states')
      .select('*')
      .eq('projectId', projectId)
      .order('timestamp', { ascending: false })
      .maybeSingle();

    if (dbState) {
      const result = MissionStateSchema.safeParse(dbState);
      if (!result.success) {
        console.error(`[Gateway] Corrupt mission state in Supabase for ${projectId}:`, result.error.format());
        return res.status(500).json({ error: 'Data integrity violation in persistent storage', details: result.error.errors });
      }
      return res.json(result.data);
    }

    res.status(404).json({ error: 'Mission state not found in active cache or persistent storage' });
  } catch (error: any) {
    res.status(500).json({ error: 'Mission query failed', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Crew Gateway active on port ${port} [Environment: ${process.env.ENVIRONMENT}]`);
});