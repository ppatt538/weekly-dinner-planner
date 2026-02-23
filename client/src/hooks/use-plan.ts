import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateWeeklyPlanRequest, type WeeklyPlanItemWithRecipe } from "@shared/schema";

export function useWeeklyPlan() {
  return useQuery({
    queryKey: [api.plan.list.path],
    queryFn: async () => {
      const res = await fetch(api.plan.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch weekly plan");
      
      const data = await res.json();
      return api.plan.list.responses[200].parse(data) as WeeklyPlanItemWithRecipe[];
    },
  });
}

export function useAddToPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateWeeklyPlanRequest) => {
      const res = await fetch(api.plan.add.path, {
        method: api.plan.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Invalid plan data");
        }
        throw new Error("Failed to add to plan");
      }
      
      return api.plan.add.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.plan.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.get.path] });
    },
  });
}

export function useRemoveFromPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.plan.remove.path, { id });
      const res = await fetch(url, { 
        method: api.plan.remove.method,
        credentials: "include" 
      });
      
      if (!res.ok && res.status !== 404) throw new Error("Failed to remove from plan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.plan.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.get.path] });
    },
  });
}

export function useClearPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.plan.clear.path, { 
        method: api.plan.clear.method,
        credentials: "include" 
      });
      
      if (!res.ok) throw new Error("Failed to clear plan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.plan.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.get.path] });
    },
  });
}
