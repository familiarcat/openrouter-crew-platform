'use client';

import React, { useState, useEffect } from 'react';

interface CostBreakdown {
  monthlyCost: number;
  savings: number;
  optimization: number;
  recommendations: string[];
  trends: { date: string; cost: number }[];
}

export default function CostOptimizationMonitor() {
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data fetch
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const data = {
          monthlyCost: 1250,
          savings: 350,
          recommendations: ['Use spot instances', 'Optimize database queries'],
          trends: [
            { date: '2023-01', cost: 1000 },
            { date: '2023-02', cost: 1200 },
            { date: '2023-03', cost: 1250 }
          ]
        };

        setCostBreakdown({
          monthlyCost: data.monthlyCost || 0,
          savings: data.savings || 0,
          optimization: data.savings ? Math.round((data.savings / (data.monthlyCost || 1)) * 100) : 0,
          recommendations: data.recommendations || [],
          trends: data.trends || []
        });
      } catch (error) {
        console.error('Failed to fetch cost data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-4">Loading cost data...</div>;
  if (!costBreakdown) return <div className="p-4">No cost data available</div>;

  return (
    <div className="glass-panel p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-4">Cost Optimization</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-sm opacity-70">Monthly Cost</div>
          <div className="text-2xl font-bold">${costBreakdown.monthlyCost}</div>
        </div>
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-sm opacity-70">Savings</div>
          <div className="text-2xl font-bold text-green-400">${costBreakdown.savings}</div>
        </div>
        <div className="bg-white/5 p-4 rounded-lg">
          <div className="text-sm opacity-70">Optimization Score</div>
          <div className="text-2xl font-bold text-blue-400">{costBreakdown.optimization}%</div>
        </div>
      </div>

      {costBreakdown.recommendations.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Recommendations</h3>
          <ul className="list-disc pl-5 space-y-1">
            {costBreakdown.recommendations.map((rec, i) => (
              <li key={i} className="text-sm opacity-80">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
