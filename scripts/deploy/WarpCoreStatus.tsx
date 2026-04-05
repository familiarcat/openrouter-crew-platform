import React from 'react';
import { useWarpCoreTelemetry } from './useWarpCoreTelemetry';
import { useWarpCoreTelemetry } from '../../apps/unified-dashboard/src/hooks/useWarpCoreTelemetry'; // Geordi: Corrected import path

/**
 * A Starfleet-themed component to display the real-time status of the Redis Warp Core.
 * Provides critical telemetry such as active keys, memory usage, and connected agents.
 */
export const WarpCoreStatus: React.FC = () => {
  const { telemetry, loading, error, refetch } = useWarpCoreTelemetry({
    pollIntervalMs: 5000, // Refresh every 5 seconds
    enabled: true,
  });

  if (loading) {
    return (
      <div className="warp-core-status loading">
        <div className="status-indicator pulse"></div>
        <p>Initializing Warp Core Diagnostics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="warp-core-status error">
        <div className="status-indicator critical"></div>
        <p>Warp Core Offline: {error}</p>
        <button onClick={refetch} className="starfleet-button">
          <span className="icon">🔄</span> Re-establish Link
        </button>
      </div>
    );
  }

  if (!telemetry) {
    return (
      <div className="warp-core-status standby">
        <div className="status-indicator standby"></div>
        <p>Warp Core on Standby. No telemetry available.</p>
      </div>
    );
  }

  const statusClass = telemetry.connected_clients > 0 ? 'online' : 'standby';

  return (
    <div className={`warp-core-status ${statusClass}`}>
      <style jsx>{`
        .warp-core-status {
          background: linear-gradient(135deg, #0a1128 0%, #121a36 100%);
          border: 1px solid #007bff;
          border-radius: 8px;
          padding: 20px;
          color: #e0e7ff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: 0 4px 15px rgba(0, 123, 255, 0.2);
          display: flex;
          flex-direction: column;
          gap: 15px;
          position: relative;
          overflow: hidden;
        }
        .warp-core-status::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at center, rgba(0, 123, 255, 0.1) 0%, transparent 70%);
          animation: warp-pulse 10s infinite linear;
          pointer-events: none;
        }
        @keyframes warp-pulse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .warp-core-status.online { border-color: #28a745; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.2); }
        .warp-core-status.error { border-color: #dc3545; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.2); }
        .warp-core-status.loading { border-color: #ffc107; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2); }
        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          position: absolute;
          top: 15px;
          right: 15px;
        }
        .status-indicator.pulse { background-color: #ffc107; animation: pulse 1.5s infinite; }
        .status-indicator.online { background-color: #28a745; }
        .status-indicator.critical { background-color: #dc3545; }
        .status-indicator.standby { background-color: #6c757d; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
        }
        h3 {
          font-size: 1.4em;
          margin-bottom: 10px;
          color: #007bff;
          text-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
        }
        .metric-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.95em;
          border-bottom: 1px dashed rgba(0, 123, 255, 0.3);
          padding-bottom: 5px;
          margin-bottom: 5px;
        }
        .metric-label { color: #a0b3d6; }
        .metric-value { font-weight: bold; }
      `}</style>
      <div className={`status-indicator ${statusClass}`}></div>
      <h3>Warp Core Telemetry</h3>
      <div className="metric-item">
        <span className="metric-label">Status:</span>
        <span className="metric-value">{telemetry.environment.toUpperCase()}</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">Active Keys:</span>
        <span className="metric-value">{telemetry.active_keys.toLocaleString()}</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">Memory Usage:</span>
        <span className="metric-value">{telemetry.memory_usage}</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">Connected Agents:</span>
        <span className="metric-value">{telemetry.connected_clients.toLocaleString()}</span>
      </div>
    </div>
  );
};