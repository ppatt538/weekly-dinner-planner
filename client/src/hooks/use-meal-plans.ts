import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type InsertMealPlan = z.infer<typeof api.mealPlans.create.input>;

export function useMealPlans() {
  return useQuery({
    queryKey: [api.mealPlans.list.path],
    queryFn: async () => {
      const res = await fetch(api.mealPlans.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meal plans");
      return api.mealPlans.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMealPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertMealPlan) => {
      const res = await fetch(api.mealPlans.create.path, {
        method: api.mealPlans.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.mealPlans.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to add meal");
      }
      return api.mealPlans.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mealPlans.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.get.path] });
    },
  });
}

export function useDeleteMealPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.mealPlans.delete.path, { id });
      const res = await fetch(url, { 
        method: api.mealPlans.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok && res.status !== 404) throw new Error("Failed to remove meal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mealPlans.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.get.path] });
    },
  });
}

export function useClearMealPlans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.mealPlans.clear.path, { 
        method: api.mealPlans.clear.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to clear week");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mealPlans.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.shoppingList.get.path] });
    },
  });
}
