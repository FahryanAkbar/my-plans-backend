import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { simulationService } from '@/services';
import { ApiError } from '@/lib';
import { AnalyticsRange, LatencyComparisonResponse } from '@/types/features';

/**
 * Hook for fetching latency comparison metrics (Real vs Predicted Latency).
 * Commonly used for rendering the simulation dual line chart.
 */
export function useLatencyComparison(projectId: string, range?: AnalyticsRange) {
  const [data, setData] = useState<LatencyComparisonResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await simulationService.getLatencyComparison(projectId, range);
      setData(result);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const errMsg = apiErr?.message || 'Failed to fetch latency comparison';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, range]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchComparison,
  };
}
