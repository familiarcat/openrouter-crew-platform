/**
 * Memory API Server
 * Simple Express server for viewing and managing memories
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { SupabaseClient } from '@supabase/supabase-js';
import { MemoryService } from './memory-service';

export function createMemoryAPI(supabase: SupabaseClient, port = 3333) {
  const app = express();
  const memoryService = new MemoryService(supabase);

  app.use(express.json());
  app.use((_req: Request, res: Response, next: any) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  // ===== Dashboard & Static Files =====

  // Serve standalone HTML dashboard
  app.get('/', (_req: Request, res: Response) => {
    const dashboardPath = path.join(__dirname, 'dashboard.html');
    res.sendFile(dashboardPath);
  });

  // ===== Memory Endpoints =====

  // GET /api/memories/project/:projectId - List all memories in project
  app.get('/api/memories/project/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { layer, minConfidence } = req.query;

      const { data: nodes, error } = await supabase
        .from('memory_nodes')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null);

      if (error) throw error;

      let filtered = nodes || [];
      if (layer) {
        filtered = filtered.filter((n) => n.layer === parseInt(layer as string));
      }
      if (minConfidence) {
        filtered = filtered.filter((n) => n.confidence_weight >= parseFloat(minConfidence as string));
      }

      // Group by layer
      const byLayer: Record<number, any[]> = {};
      for (const node of filtered) {
        if (!byLayer[node.layer]) byLayer[node.layer] = [];
        const layer = byLayer[node.layer];
        if (layer) layer.push(node);
      }

      res.json({
        projectId,
        totalMemories: filtered.length,
        byLayer,
        summary: {
          layer1: byLayer[1]?.length || 0,
          layer2: byLayer[2]?.length || 0,
          layer3: byLayer[3]?.length || 0,
          layer4: byLayer[4]?.length || 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/memories/:memoryId - Get single memory with neighbors
  app.get('/api/memories/:memoryId', async (req: Request, res: Response) => {
    try {
      const { memoryId } = req.params;

      // Get memory node
      const { data: node, error: nodeError } = await supabase
        .from('memory_nodes')
        .select('*')
        .eq('id', memoryId)
        .single();

      if (nodeError) throw nodeError;

      // Get outgoing edges
      const { data: outgoing } = await supabase
        .from('memory_edges')
        .select('*')
        .eq('source_id', memoryId)
        .order('weight', { ascending: false });

      // Get incoming edges
      const { data: incoming } = await supabase
        .from('memory_edges')
        .select('*')
        .eq('target_id', memoryId)
        .order('weight', { ascending: false });

      res.json({
        node,
        outgoing: outgoing || [],
        incoming: incoming || [],
        neighbors: {
          outgoing: outgoing?.length || 0,
          incoming: incoming?.length || 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/stats/project/:projectId - Project statistics
  app.get('/api/stats/project/:projectId', async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;

      const { data: nodes } = await supabase
        .from('memory_nodes')
        .select('*')
        .eq('project_id', projectId)
        .is('deleted_at', null);

      const { data: edges } = await supabase
        .from('memory_edges')
        .select('*');

      const nodeList = nodes || [];
      const edgeList = edges || [];

      // Calculate stats
      const avgConfidence = nodeList.length > 0
        ? nodeList.reduce((s, n) => s + n.confidence_weight, 0) / nodeList.length
        : 0;

      const avgEdgeWeight = edgeList.length > 0
        ? edgeList.reduce((s, e) => s + e.weight, 0) / edgeList.length
        : 0;

      const byTier: Record<string, number> = {};
      for (const node of nodeList) {
        byTier[node.retention_tier] = (byTier[node.retention_tier] || 0) + 1;
      }

      res.json({
        projectId,
        nodes: nodeList.length,
        edges: edgeList.length,
        avgConfidence: parseFloat(avgConfidence.toFixed(3)),
        avgEdgeWeight: parseFloat(avgEdgeWeight.toFixed(3)),
        byTier,
        maxConfidence: Math.max(...nodeList.map((n) => n.confidence_weight), 0),
        minConfidence: Math.min(...nodeList.map((n) => n.confidence_weight), 1),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /api/retrieve - Test memory retrieval
  app.get('/api/retrieve', async (req: Request, res: Response) => {
    try {
      const { projectId, context, maxResults } = req.query;

      if (!projectId || !context) {
        res.status(400).json({ error: 'Missing projectId or context' });
        return;
      }

      const result = await memoryService.retrieve({
        projectId: projectId as string,
        context: context as string,
        maxResults: maxResults ? parseInt(maxResults as string) : 10,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  const server = app.listen(port, () => {
    console.log(`\n🧠 Memory API Server listening on http://localhost:${port}`);
    console.log(`\nDashboard & Web Interface:`);
    console.log(`  📊 http://localhost:${port}/?projectId={projectId}`);
    console.log(`\nREST API Endpoints:`);
    console.log(`  GET  /api/memories/project/{projectId}?layer=1&minConfidence=0.5`);
    console.log(`  GET  /api/memories/{memoryId}`);
    console.log(`  GET  /api/stats/project/{projectId}`);
    console.log(`  GET  /api/retrieve?projectId=...&context=...&maxResults=10`);
    console.log(`  GET  /health\n`);
  });

  return server;
}
