'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type Project } from '@openrouter-crew/shared-schemas';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    isLoading,
    error,
    refresh: fetchProjects
  };
};