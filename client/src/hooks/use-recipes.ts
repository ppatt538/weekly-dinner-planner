import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type RecipeWithIngredients } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useRecipes(search?: string) {
  return useQuery({
    queryKey: [api.recipes.list.path, search],
    queryFn: async () => {
      const url = buildUrl(api.recipes.list.path);
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(url + queryParams, { credentials: "include" });
      
      if (!res.ok) throw new Error("Failed to fetch recipes");
      
      const data = await res.json();
      return api.recipes.list.responses[200].parse(data) as RecipeWithIngredients[];
    },
  });
}

export function useRecipe(id: number) {
  return useQuery({
    queryKey: [api.recipes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.recipes.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch recipe");
      
      const data = await res.json();
      return api.recipes.get.responses[200].parse(data) as RecipeWithIngredients;
    },
    enabled: !!id,
  });
}

export function useUpdateRecipeImage() {
  return useMutation({
    mutationFn: async ({ id, imageUrl }: { id: number; imageUrl: string }) => {
      const url = buildUrl(api.recipes.updateImage.path, { id });
      return apiRequest("PATCH", url, { imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
    },
  });
}

export function useUpdateRecipeServings() {
  return useMutation({
    mutationFn: async ({ id, servings }: { id: number; servings: number }) => {
      const url = buildUrl(api.recipes.updateServings.path, { id });
      return apiRequest("PATCH", url, { servings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
    },
  });
}

export function useToggleFavorite() {
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.recipes.toggleFavorite.path, { id });
      return apiRequest("PATCH", url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
    },
  });
}

type IngredientInput = { name: string; quantity?: string };

export function useUpdateRecipe() {
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: { name: string; cuisine?: string; ingredients?: IngredientInput[]; instructions?: string[] }
    }) => {
      const url = buildUrl(api.recipes.update.path, { id });
      return apiRequest("PUT", url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/plan"] });
    },
  });
}

export function useDeleteRecipe() {
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.recipes.delete.path, { id });
      return apiRequest("DELETE", url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/plan"] });
    },
  });
}
