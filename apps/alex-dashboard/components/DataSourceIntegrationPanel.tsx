'use client';

import React, { useState, useEffect } from 'react';

type SourceType = 'database' | 'file' | 'api' | 'stream' | 'webhook';
type SourceStatus = 'active' | 'inactive' | 'error' | 'syncing';

interface DataSource {
  id: string;
  name: string;
  type: SourceType;
  status: SourceStatus;
  description: string;
  lastSync: string;
  recordCount?: number;
  integration: string;
}

interface IntegrationOpportunity {
  id: string;
  name: string;
  description: string;
  potentialImpact: string;
}

export default function DataSourceIntegrationPanel() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [opportunities, setOpportunities] = useState<IntegrationOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error('Mock error to trigger fallback');
      } catch (error) {
        // Fallback to sample data
        const sampleData = getSampleData();
        setSources(sampleData.sources);
        setOpportunities(sampleData.opportunities);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4">Loading integrations...</div>;

  return (
    <div className="glass-panel p-6 rounded-xl h-full overflow-auto">
      <h2 className="text-xl font-bold mb-4">Data Source Integrations</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-semibold opacity-70 mb-3 uppercase tracking-wider">Active Sources</h3>
        <div className="space-y-3">
          {sources.map(source => (
            <div key={source.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-center">
              <div>
                <div className="font-medium flex items-center gap-2">
                  {source.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    source.status === 'active' ? 'bg-green-500/20 text-green-300' : 
                    source.status === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20'
                  }`}>
                    {source.status}
                  </span>
                </div>
                <div className="text-xs opacity-60 mt-1">{source.type} • {source.integration}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono">{source.recordCount?.toLocaleString() || '-'}</div>
                <div className="text-xs opacity-50">records</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold opacity-70 mb-3 uppercase tracking-wider">Integration Opportunities</h3>
        <div className="space-y-3">
          {opportunities.map(opp => (
            <div key={opp.id} className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <div className="font-medium text-blue-300">{opp.name}</div>
              <div className="text-sm opacity-80 mt-1">{opp.description}</div>
              <div className="text-xs text-blue-200 mt-2">Impact: {opp.potentialImpact}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getSampleData(): { sources: DataSource[]; opportunities: IntegrationOpportunity[] } {
  return {
    sources: [
      {
        id: '1',
        name: 'Supabase DB',
        type: 'database',
        status: 'active',
        description: 'Main application database',
        lastSync: new Date().toISOString(),
        recordCount: 15420,
        integration: 'Direct'
      },
      {
        id: '2',
        name: 'Knowledge Base',
        type: 'database',
        status: 'active',
        description: 'Vector embeddings for RAG',
        lastSync: new Date().toISOString(),
        recordCount: 850,
        integration: 'pgvector'
      },
      {
        id: '3',
        name: 'External API',
        type: 'api',
        status: 'syncing',
        description: 'Third-party data feed',
        lastSync: new Date().toISOString(),
        integration: 'n8n Workflow'
      }
    ],
    opportunities: [
      {
        id: '1',
        name: 'Connect CRM',
        description: 'Sync customer data for better personalization',
        potentialImpact: 'High'
      },
      {
        id: '2',
        name: 'Log Aggregation',
        description: 'Centralize logs from all services',
        potentialImpact: 'Medium'
      }
    ]
  };
}
