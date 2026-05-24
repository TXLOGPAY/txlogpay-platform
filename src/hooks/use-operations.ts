import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { operationsDb, type DBOperation } from "@/services/operations.db";
import { useAuth } from "@/hooks/use-auth";

const KEYS = {
  all: ["operations"] as const,
  active: ["operations", "active"] as const,
  detail: (id: string) => ["operations", "detail", id] as const,
};

export function useActiveOperations() {
  const { isAuthenticated } = useAuth();
  return useQuery<DBOperation[]>({
    queryKey: KEYS.active,
    queryFn: () => operationsDb.listActive(),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });
}

export function useAllOperations() {
  const { isAuthenticated } = useAuth();
  return useQuery<DBOperation[]>({
    queryKey: KEYS.all,
    queryFn: () => operationsDb.list(),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });
}

export function useOperation(id: string | undefined) {
  return useQuery<DBOperation | null>({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => (id ? operationsDb.get(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 5_000,
  });
}

export function useMarkOperationActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => operationsDb.markActive(id),
    onSuccess: (op) => {
      qc.invalidateQueries({ queryKey: ["operations"] });
      qc.setQueryData(KEYS.detail(op.id), op);
    },
  });
}
