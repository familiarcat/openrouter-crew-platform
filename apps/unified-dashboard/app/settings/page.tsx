'use client';

import React, { useState } from 'react';
import { Save, AlertCircle, Bell, Shield, Database, Zap } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Global Settings</h1>
        <p className="text-gray-400">Configure platform-wide preferences and integrations</p>
      </div>

      {saved && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span className="text-green-500">Settings saved successfully</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              <span className="text-gray-300">Email notifications for critical alerts</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              <span className="text-gray-300">Slack integration enabled</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-gray-300">Daily digest reports</span>
            </label>
          </div>
        </div>

        {/* Security */}
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Security Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm">API Key Rotation (days)</label>
              <input type="number" defaultValue="90" className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              <span className="text-gray-300">Enable two-factor authentication</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              <span className="text-gray-300">Enforce HTTPS</span>
            </label>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">Performance Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm">Cache TTL (seconds)</label>
              <input type="number" defaultValue="3600" className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <div>
              <label className="text-gray-300 text-sm">Request Timeout (seconds)</label>
              <input type="number" defaultValue="30" className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Data Management</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm">Retention Period (days)</label>
              <input type="number" defaultValue="365" className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-gray-300">Automatic backup enabled</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
        <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

function CheckCircle2({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
