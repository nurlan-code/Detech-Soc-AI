import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { incidentsApi } from "@/lib/api";
import toast from "react-hot-toast";

export function useIncidents(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["incidents", page, pageSize],
    queryFn: () => incidentsApi.list({ page, page_size: pageSize }).then((r) => r.data),
    refetchInterval: 30000,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ["incident", id],
    queryFn: () => incidentsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCloseIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incidentsApi.close(id) as Promise<unknown>,
    onSuccess: () => {
      toast.success("Incident closed");
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
