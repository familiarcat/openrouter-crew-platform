import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.AGENT_PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      agent: 'booking-agent',
      port: PORT,
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      agent: 'booking-agent',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// MCP tool execution endpoint
app.post('/tools/:toolName', async (req, res) => {
  const { toolName } = req.params;
  const { args } = req.body;
  
  console.log(`[booking-agent] Executing tool: ${toolName}`);
  
  try {
    // Log to database
    await pool.query(
      'INSERT INTO agent_logs (agent_name, action, payload) VALUES ($1, $2, $3)',
      ['booking-agent', toolName, JSON.stringify(args)]
    );
    
    // Universal Crew Consultation Tool
    if (toolName === 'consult_crew') {
      const { member, message, context } = args;
      const envKey = `N8N_CREW_${member.toUpperCase()}_WEBHOOK`;
      const webhookUrl = process.env[envKey];

      if (!webhookUrl) {
        throw new Error(`Crew member ${member} not configured (missing ${envKey})`);
      }

      console.log(`[booking-agent] Consulting Crew Member: ${member}`);
      const crewResponse = await axios.post(webhookUrl, {
        agent: 'booking-agent',
        message,
        context,
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        agent: 'booking-agent',
        tool: 'consult_crew',
        result: crewResponse.data
      });
    }

    // Tool execution logic would go here
    const result = {
      success: true,
      agent: 'booking-agent',
      tool: toolName,
      result: { 
        message: 'Tool executed successfully',
        args,
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error(`[booking-agent] Error executing tool:`, error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[booking-agent] MCP Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log(`[booking-agent] SIGTERM received, closing server...`);
  await pool.end();
  process.exit(0);
});
