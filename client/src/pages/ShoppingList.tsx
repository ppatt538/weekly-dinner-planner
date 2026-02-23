import { useShoppingList } from "@/hooks/use-shopping-list";
import { Header } from "@/components/Header";
import { 
  CheckCircle2, 
  Circle, 
  ShoppingBasket, 
  Printer, 
  Share2,
  ChefHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ShoppingList() {
  const { data: list, isLoading } = useShoppingList();
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleItem = (id: number) => {
    const next = new Set(checkedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedItems(next);
  };

  const sortedList = list ? [...list].sort((a, b) => {
    // Sort checked items to bottom
    const aChecked = checkedItems.has(a.ingredientId);
    const bChecked = checkedItems.has(b.ingredientId);
    if (aChecked === bChecked) return a.name.localeCompare(b.name);
    return aChecked ? 1 : -1;
  }) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <span className="p-2 bg-accent/10 rounded-xl text-accent">
                <ShoppingBasket className="w-8 h-8" />
              </span>
              Shopping List
            </h1>
            <p className="text-muted-foreground mt-1 ml-1">
              Generated from your weekly meal plan
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : sortedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/50 rounded-3xl bg-card/50">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 text-4xl">
              📝
            </div>
            <h3 className="text-xl font-display font-bold text-foreground">Your list is empty</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Start adding meals to your weekly plan to generate your shopping list automatically.
            </p>
            <Button asChild className="mt-8">
              <a href="/">Go to Planner</a>
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-border/40">
              {sortedList.map((item) => {
                const isChecked = checkedItems.has(item.ingredientId);
                return (
                  <motion.div 
                    key={item.ingredientId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "group flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer select-none",
                      isChecked && "bg-muted/30"
                    )}
                    onClick={() => toggleItem(item.ingredientId)}
                  >
                    <div className={cn(
                      "mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300",
                      isChecked 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-muted-foreground/40 group-hover:border-primary"
                    )}>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "font-medium text-lg transition-all",
                          isChecked ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {item.name}
                        </span>
                        <span className="text-sm font-semibold bg-secondary px-2 py-1 rounded-md text-secondary-foreground">
                          {item.quantity}
                        </span>
                      </div>
                      
                      {!isChecked && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {item.recipes.map((recipe, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              <ChefHat className="w-3 h-3" />
                              {recipe}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="bg-muted/20 p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
              <span>{checkedItems.size} of {sortedList.length} items checked</span>
              {checkedItems.size > 0 && (
                <button 
                  onClick={() => setCheckedItems(new Set())}
                  className="text-primary hover:underline font-medium"
                >
                  Uncheck all
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
