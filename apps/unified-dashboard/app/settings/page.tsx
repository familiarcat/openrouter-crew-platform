'use client';

import React from 'react';
import { User, Lock, Bell, Globe, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Profile Section */}
        <section className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-blue-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
              <input type="text" defaultValue="Admin User" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input type="email" defaultValue="admin@openrouter.ai" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </section>

        {/* API Keys */}
        <section className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="text-yellow-400" size={24} />
            <h2 className="text-xl font-semibold text-white">API Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">OpenRouter API Key</label>
              <div className="flex gap-2">
                <input type="password" value="sk-or-xxxxxxxxxxxxxxxx" readOnly className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-gray-400 font-mono" />
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors">Reveal</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Supabase URL</label>
              <input type="text" defaultValue="https://xyz.supabase.co" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-[#16181d] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="text-red-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-600 bg-black/20 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-300">Email alerts for budget overruns</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-600 bg-black/20 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-300">Weekly digest reports</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-black/20 text-blue-600 focus:ring-blue-500" />
              <span className="text-gray-300">System health alerts</span>
            </label>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20">
            <Save size={18} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}