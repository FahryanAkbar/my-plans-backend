import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { analyticsService } from '@/services';
import type { ApiError } from '@/lib';
import type { AnalyticsRange, UptimeHistoryResponse } from '@/types/features';

/**
 * Hook for fetching historical uptime percentage trend over time.
 */
export function useUptimeHistory(projectId: string, range?: AnalyticsRange) {
  const [trend, setTrend] = useState<UptimeHistoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUptimeHistory = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getUptimeHistory(projectId, range);
      setTrend(result);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const errMsg = apiErr?.message || 'Failed to fetch uptime history';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, range]);

  useEffect(() => {
    fetchUptimeHistory();
  }, [fetchUptimeHistory]);

  return {
    trend,
    isLoading,
    error,
    refetch: fetchUptimeHistory,
  };
}
