import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Filter params type inferred from Zod schema
type RecipeListParams = z.infer<NonNullable<typeof api.recipes.list.input>>;

export function useRecipes(filters?: RecipeListParams) {
  // Construct query key based on filters to ensure caching works correctly
  const queryKey = filters 
    ? [api.recipes.list.path, filters] 
    : [api.recipes.list.path];

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Build query string from filters
      const params = filters as Record<string, string>;
      const url = filters 
        ? `${api.recipes.list.path}?${new URLSearchParams(params).toString()}`
        : api.recipes.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recipes");
      
      return api.recipes.list.responses[200].parse(await res.json());
    },
  });
}

export function useRecipe(id: number | null) {
  return useQuery({
    queryKey: [api.recipes.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const url = buildUrl(api.recipes.get.path, { id });
      
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch recipe");
      
      return api.recipes.get.responses[200].parse(await res.json());
    },
  });
}
