import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { analyticsService } from '@/services';
import type { ApiError } from '@/lib';
import type { AnalyticsRange, DowntimeEvent } from '@/types/features';

/**
 * Hook for fetching recent downtime and failure incidents log.
 */
export function useDowntimeHistory(projectId: string, range?: AnalyticsRange) {
  const [events, setEvents] = useState<DowntimeEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDowntime = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getDowntimeHistory(projectId, range);
      setEvents(result);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const errMsg = apiErr?.message || 'Failed to fetch downtime history';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, range]);

  useEffect(() => {
    fetchDowntime();
  }, [fetchDowntime]);

  return {
    events,
    isLoading,
    error,
    refetch: fetchDowntime,
  };
}
