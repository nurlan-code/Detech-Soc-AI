import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api";
import { AlertSeverity, AlertStatus } from "@/types";
import toast from "react-hot-toast";

interface AlertFilters {
  page?: number;
  page_size?: number;
  severity?: AlertSeverity;
  status?: AlertStatus;
  search?: string;
  [key: string]: unknown;
}

export function useAlerts(filters: AlertFilters = {}) {
  return useQuery({
    queryKey: ["alerts", filters],
    queryFn: () => alertsApi.list(filters).then((r) => r.data),
    refetchInterval: 30000,
  });
}

export function useAlert(id: string) {
  return useQuery({
    queryKey: ["alert", id],
    queryFn: () => alertsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useTriageAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.triage(id) as Promise<unknown>,
    onSuccess: (_, id) => {
      toast.success("AI triage initiated");
      queryClient.invalidateQueries({ queryKey: ["alert", id] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: () => toast.error("Triage failed"),
  });
}

export function useEscalateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.escalate(id) as Promise<unknown>,
    onSuccess: () => {
      toast.success("Alert escalated to incident");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
