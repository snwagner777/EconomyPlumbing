import { useQuery } from '@tanstack/react-query';

/**
 * Hook to fetch friendly name for a job type ID
 */
export function useJobTypeName(jobTypeId: number | null | undefined) {
  return useQuery<{ id: number; name: string; code: string }>({
    queryKey: ['/api/portal/job-types', jobTypeId],
    enabled: !!jobTypeId && jobTypeId > 0,
    queryFn: async () => {
      const response = await fetch(`/api/portal/job-types/${jobTypeId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job type name`);
      }

      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour - job types don't change often
  });
}
