/**
 * Budget Management Page
 * Displays budget allocation, history, and alert settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import BudgetAllocationChart from '@/components/budget/BudgetAllocationChart';
import BudgetHistoryChart from '@/components/budget/BudgetHistoryChart';
import BudgetAlertSettings from '@/components/budget/BudgetAlertSettings';
import { CostOptimizationService } from '@openrouter-crew/crew-api-client';

interface BudgetData {
  crewId: string;
  limit: number;
  spent: number;
  remaining: number;
  period: string;
  percentUsed: number;
}

export default function BudgetPage() {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'alerts'>('overview');

  useEffect(() => {
    const loadBudgetData = async () => {
      try {
        const costService = new CostOptimizationService();
        // Set default budget for demo
        costService.setBudget('crew_1', 500, 'monthly');
        costService.updateBudget('crew_1', 320);
        const budget = costService.getBudget('crew_1');

        setBudgetData({
          crewId: 'crew_1',
          limit: budget?.limit || 500,
          spent: budget?.spent || 320,
          remaining: budget?.remaining || 180,
          period: budget?.period || 'monthly',
          percentUsed: budget?.percentUsed || 64,
        });
      } catch (error) {
        console.error('Failed to load budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBudgetData();
  }, []);

  if (loading || !budgetData) {
    return <div className="p-8 text-gray-500">Loading budget data...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage crew budgets</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Budget Limit</p>
            <p className="text-2xl font-bold text-gray-900">${budgetData.limit.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Amount Spent</p>
            <p className="text-2xl font-bold text-red-600">${budgetData.spent.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Remaining</p>
            <p className="text-2xl font-bold text-green-600">${budgetData.remaining.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Usage</p>
            <p className="text-2xl font-bold text-blue-600">{budgetData.percentUsed.toFixed(1)}%</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'alerts'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Alerts
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Budget Allocation</h2>
              <BudgetAllocationChart budget={budgetData} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Budget History</h2>
              <BudgetHistoryChart crewId={budgetData.crewId} />
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Alert Settings</h2>
              <BudgetAlertSettings crewId={budgetData.crewId} currentUsage={budgetData.percentUsed} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
