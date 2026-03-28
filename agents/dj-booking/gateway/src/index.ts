import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// Agent URLs
const agents = {
  booking: process.env.BOOKING_AGENT_URL || 'http://booking-agent:3001',
  finance: process.env.FINANCE_AGENT_URL || 'http://finance-agent:3002',
  music: process.env.MUSIC_AGENT_URL || 'http://music-agent:3003',
  marketing: process.env.MARKETING_AGENT_URL || 'http://marketing-agent:3004',
  venue: process.env.VENUE_AGENT_URL || 'http://venue-agent:3005',
  rag_refresh: process.env.RAG_REFRESH_AGENT_URL || 'http://rag-refresh-agent:3006',
};

app.use(cors());
app.use(express.json());

// Root route to prevent 404 CSP errors in browser
app.get('/', (req, res) => {
  res.json({ status: 'running', service: 'gateway' });
});
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'gateway',
    agents: {} as Record<string, string>
  };
  
  for (const [name, url] of Object.entries(agents)) {
    try {
      await axios.get(`${url}/health`, { timeout: 2000 });
      health.agents[name] = 'healthy';
    } catch {
      health.agents[name] = 'unhealthy';
    }
  }
  
  res.json(health);
});

// Route to specific agent
app.post('/api/agents/:agent/:tool', async (req, res) => {
  const { agent, tool } = req.params;
  const agentUrl = agents[agent as keyof typeof agents];
  
  if (!agentUrl) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  try {
    const response = await axios.post(`${agentUrl}/tools/${tool}`, req.body, {
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error(`Gateway error calling ${agent}:`, error);
    res.status(500).json({ 
      error: 'Agent communication failed',
      agent,
      tool
    });
  }
});

// Coordinate multiple agents
app.post('/api/coordinate', async (req, res) => {
  const { workflow } = req.body;
  
  try {
    // Execute coordinated workflow
    const results = {
      workflow,
      timestamp: new Date().toISOString(),
      agents: []
    };
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Coordination failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  console.log('Agents:', agents);
});
