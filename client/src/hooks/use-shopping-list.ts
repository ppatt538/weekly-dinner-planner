import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type ShoppingListResponse } from "@shared/schema";

export function useShoppingList() {
  return useQuery({
    queryKey: [api.shoppingList.get.path],
    queryFn: async () => {
      const res = await fetch(api.shoppingList.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch shopping list");
      
      const data = await res.json();
      return api.shoppingList.get.responses[200].parse(data) as ShoppingListResponse;
    },
  });
}
