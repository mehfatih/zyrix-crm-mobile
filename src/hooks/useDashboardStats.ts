/**
 * useDashboardStats — powers the merchant dashboard hero. Refetches
 * every 5 minutes in the background so the numbers don't drift while
 * the screen is open, and exposes `refetch` for pull-to-refresh.
 */

import {
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  getDashboardStats,
  type DashboardStats,
} from '../api/reports';

export const DASHBOARD_STATS_QUERY_KEY = ['reports', 'dashboard'] as const;

const FIVE_MINUTES = 5 * 60 * 1000;

export const useDashboardStats = (): UseQueryResult<DashboardStats, Error> => {
  return useQuery<DashboardStats, Error>({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: () => getDashboardStats(),
    staleTime: FIVE_MINUTES / 2,
    refetchInterval: FIVE_MINUTES,
    refetchOnWindowFocus: false,
  });
};
