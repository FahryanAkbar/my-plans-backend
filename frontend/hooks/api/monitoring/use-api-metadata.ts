import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { monitoringService } from '@/services';
import type { ApiError } from '@/lib';
import type { ApiMetadata } from '@/types/features';

/**
 * Hook for fetching API Gateway status metadata and uptime.
 */
export function useApiMetadata() {
  const [metadata, setMetadata] = useState<ApiMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await monitoringService.getApiMetadata();
      setMetadata(data);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const errMsg = apiErr?.message || 'Failed to fetch API metadata';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    metadata,
    isLoading,
    error,
    refetch: fetchMetadata,
  };
}
