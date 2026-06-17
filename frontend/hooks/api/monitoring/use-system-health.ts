import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { monitoringService } from '@/services';
import type { ApiError } from '@/lib';
import type { HealthStatus } from '@/types/features';

/**
 * Hook for checking real-time system health (Postgres, Redis, InfluxDB).
 */
export function useSystemHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await monitoringService.getHealthStatus();
      setHealth(data);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const errMsg = apiErr?.message || 'Failed to fetch system health status';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return {
    health,
    isLoading,
    error,
    refetch: fetchHealth,
  };
}
