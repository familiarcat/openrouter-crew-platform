'use client';

import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock, 
  ExternalLink, 
  Server, 
  Cloud, 
  Monitor,
  GitCommit
} from 'lucide-react';
import { type DeploymentLog } from '@openrouter-crew/shared-schemas';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DeploymentLogListProps {
  projectId?: string;
  limit?: number;
}

export const DeploymentLogList: React.FC<DeploymentLogListProps> = ({ 
  projectId, 
  limit = 10 
}) => {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchInitialLogs = async () => {
      let query = supabase
        .from('deployment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setLogs(data as DeploymentLog[]);
      }
      setIsLoading(false);
    };

    fetchInitialLogs();

    // Set up Real-time subscription
    const channel = supabase
      .channel('deployment_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deployment_logs',
          filter: projectId ? `project_id=eq.${projectId}` : undefined,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLogs((prev) => [payload.new as DeploymentLog, ...prev].slice(0, limit));
          } else if (payload.eventType === 'UPDATE') {
            setLogs((prev) => 
              prev.map((log) => log.id === payload.new.id ? (payload.new as DeploymentLog) : log)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, limit, supabase]);

  const getStatusIcon = (status: DeploymentLog['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'building': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPlatformIcon = (platform: DeploymentLog['platform']) => {
    switch (platform) {
      case 'vercel': return <Cloud className="w-4 h-4" />;
      case 'aws': return <Server className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  if (isLoading) return <div className="p-4 animate-pulse bg-gray-100 rounded-lg h-32" />;

  return (
    <div className="flex flex-col gap-3">
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-xl">
          No deployment history found.
        </div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-4">
              <div className={cn("p-2 rounded-full", log.status === 'building' ? 'bg-blue-50' : 'bg-gray-50 dark:bg-gray-800')}>
                {getStatusIcon(log.status)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm capitalize">{log.platform} Build</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase font-bold tracking-wider">
                    {log.environment}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">{getPlatformIcon(log.platform)} {log.status}</span>
                  <span>•</span>
                  <span>{log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : 'unknown'}</span>
                  {log.commit_sha && (
                    <span className="flex items-center gap-1"><GitCommit className="w-3 h-3" /> {log.commit_sha.substring(0, 7)}</span>
                  )}
                </div>
              </div>
            </div>
            {log.build_url && (
              <a 
                href={log.build_url} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
};