import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { analyticsService } from '@/services';
import type { ApiError } from '@/lib';
import type { AnalyticsRange, TimingBreakdownResponse } from '@/types/features';

/**
 * Hook for fetching average connection timing breakdown (DNS, TCP, TLS, TTFB, Download).
 */
export function useTimingBreakdown(projectId: string, range?: AnalyticsRange) {
  const [breakdown, setBreakdown] = useState<TimingBreakdownResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakdown = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getTimingBreakdown(projectId, range);
      setBreakdown(result);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const errMsg = apiErr?.message || 'Failed to fetch timing breakdown';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, range]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  return {
    breakdown,
    isLoading,
    error,
    refetch: fetchBreakdown,
  };
}
