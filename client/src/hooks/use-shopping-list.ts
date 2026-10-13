import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useShoppingList() {
  return useQuery({
    queryKey: [api.shoppingList.get.path],
    queryFn: async () => {
      const res = await fetch(api.shoppingList.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch shopping list");
      return api.shoppingList.get.responses[200].parse(await res.json());
    },
  });
}
