/**
 * Budget Alert Settings Component
 * Configure and manage budget alerts
 */

'use client';

import React, { useState } from 'react';

interface AlertSettings {
  thresholdWarning: number;
  thresholdCritical: number;
  emailNotifications: boolean;
  webhookNotifications: boolean;
  notificationChannels: string[];
}

interface Props {
  crewId: string;
  currentUsage: number;
}

export default function BudgetAlertSettings({ crewId, currentUsage }: Props) {
  const [settings, setSettings] = useState<AlertSettings>({
    thresholdWarning: 75,
    thresholdCritical: 90,
    emailNotifications: true,
    webhookNotifications: false,
    notificationChannels: ['email'],
  });

  const [saved, setSaved] = useState(false);

  const handleThresholdChange = (type: 'warning' | 'critical', value: number) => {
    setSettings(prev => ({
      ...prev,
      [`threshold${type.charAt(0).toUpperCase() + type.slice(1)}`]: value,
    }));
    setSaved(false);
  };

  const toggleNotification = (type: 'email' | 'webhook') => {
    const key = type === 'email' ? 'emailNotifications' : 'webhookNotifications';
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getStatusColor = (threshold: number): string => {
    if (currentUsage >= threshold) return 'text-red-600';
    if (currentUsage >= threshold - 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (threshold: number): string => {
    if (currentUsage >= threshold) return '🔴';
    if (currentUsage >= threshold - 10) return '🟡';
    return '🟢';
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900 font-medium">Current Budget Status</p>
        <p className={`text-2xl font-bold mt-1 ${getStatusColor(settings.thresholdCritical)}`}>
          {getStatusIcon(settings.thresholdCritical)} {currentUsage.toFixed(1)}% Used
        </p>
      </div>

      {/* Alert Thresholds */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Alert Thresholds</h3>

        {/* Warning Threshold */}
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Warning Threshold</span>
            <span className="text-lg font-bold text-yellow-600">{settings.thresholdWarning}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.thresholdWarning}
            onChange={(e) => handleThresholdChange('warning', parseInt(e.target.value))}
            className="w-full accent-yellow-500"
          />
          <p className="text-xs text-gray-500">
            Alert when budget usage reaches {settings.thresholdWarning}%
          </p>
        </div>

        {/* Critical Threshold */}
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Critical Threshold</span>
            <span className="text-lg font-bold text-red-600">{settings.thresholdCritical}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.thresholdCritical}
            onChange={(e) => handleThresholdChange('critical', parseInt(e.target.value))}
            className="w-full accent-red-500"
          />
          <p className="text-xs text-gray-500">
            Critical alert when budget usage reaches {settings.thresholdCritical}%
          </p>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="font-semibold text-gray-900">Notification Channels</h3>

        <div className="space-y-3">
          {/* Email */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => toggleNotification('email')}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <span className="text-sm text-gray-700">📧 Email Notifications</span>
            {settings.emailNotifications && <span className="text-xs text-green-600">Enabled</span>}
          </label>

          {/* Webhook */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.webhookNotifications}
              onChange={() => toggleNotification('webhook')}
              className="w-4 h-4 text-blue-500 rounded"
            />
            <span className="text-sm text-gray-700">🔗 Webhook Notifications</span>
            {settings.webhookNotifications && <span className="text-xs text-green-600">Enabled</span>}
          </label>
        </div>

        {settings.webhookNotifications && (
          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-600 font-medium">Webhook URL</p>
            <input
              type="text"
              placeholder="https://example.com/webhook"
              className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex gap-3 pt-6 border-t">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
        >
          Save Settings
        </button>

        {saved && <div className="flex items-center gap-2 text-green-600 text-sm">✅ Saved!</div>}
      </div>
    </div>
  );
}
