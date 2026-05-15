import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
    refetchInterval: 30000,
  });
}

export function useAlertTrend(days = 30) {
  return useQuery({
    queryKey: ["alert-trend", days],
    queryFn: () => dashboardApi.getAlertTrend(days).then((r) => r.data),
  });
}

export function useMitreHeatmap() {
  return useQuery({
    queryKey: ["mitre-heatmap"],
    queryFn: () => dashboardApi.getMitreHeatmap().then((r) => r.data),
  });
}
