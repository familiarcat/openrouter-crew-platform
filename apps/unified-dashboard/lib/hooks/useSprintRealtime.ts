// File: apps/unified-dashboard/lib/hooks/useSprintRealtime.ts

'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'
import type { Tables } from '@openrouter-crew/shared-schemas'

interface UseSprintRealtimeResult {
  stories: Tables<'stories'>[]
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Real-time hook for sprint stories using Supabase postgres_changes
 * Subscribes to the stories table filtered by sprint_id
 */
export function useSprintRealtime(sprintId: string): UseSprintRealtimeResult {
  const [stories, setStories] = useState<Tables<'stories'>[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initial load of stories
  const loadStories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const supabase = getSupabase()

      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .eq('sprint_id', sprintId)
        .order('priority', { ascending: true })

      if (fetchError) throw fetchError
      setStories(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stories'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [sprintId])

  // Subscribe to real-time updates
  useEffect(() => {
    loadStories()

    const supabase = getSupabase()
    const channel = supabase
      .channel(`stories-${sprintId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `sprint_id=eq.${sprintId}`,
        },
        (payload) => {
          setIsConnected(true)

          if (payload.eventType === 'INSERT') {
            setStories((prev) => [...prev, payload.new as Tables<'stories'>])
          } else if (payload.eventType === 'UPDATE') {
            setStories((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as Tables<'stories'>) : s))
            )
          } else if (payload.eventType === 'DELETE') {
            setStories((prev) => prev.filter((s) => s.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sprintId, loadStories])

  return { stories, isConnected, isLoading, error }
}
