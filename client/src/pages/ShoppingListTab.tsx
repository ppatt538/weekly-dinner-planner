import { useShoppingList } from "@/hooks/use-shopping-list";
import { 
  CheckCircle2, 
  ShoppingBasket, 
  Printer, 
  ChefHat,
  Loader2,
  Beef,
  Wheat,
  Carrot,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type CategoryType = "Protein" | "Grains" | "Produce" | "Dairy" | "Other";

const CATEGORY_CONFIG: Record<CategoryType, { icon: typeof Beef; color: string }> = {
  Protein: { icon: Beef, color: "text-red-500" },
  Grains: { icon: Wheat, color: "text-amber-600" },
  Produce: { icon: Carrot, color: "text-green-500" },
  Dairy: { icon: Package, color: "text-blue-500" },
  Other: { icon: Package, color: "text-gray-500" },
};

const PANTRY_KEYWORDS = [
  "powder", "stock concentrate", "sauce", "seasoning", "spice", "dried", "oil", 
  "vinegar", "paste", "extract", "soup", "broth", "condensed", "ground pepper", 
  "black pepper", "white pepper", "flakes", "seeds"
];
const PROTEIN_KEYWORDS = [
  "ground beef", "ground chicken", "ground pork", "ground turkey", "beef", "chicken", 
  "pork", "turkey", "steak", "sausage", "meatball", "meatloaf", "cutlet", "bacon", 
  "egg", "shrimp", "fish", "salmon", "tilapia"
];
const GRAINS_KEYWORDS = [
  "rice", "pasta", "linguine", "noodle", "bread", "ciabatta", "tortilla", "couscous", 
  "panko", "breadcrumb", "flour", "ramen"
];
const PRODUCE_KEYWORDS = [
  "onion", "garlic", "tomato", "pepper", "carrot", "potato", "bean", "cucumber", 
  "lime", "scallion", "cabbage", "zucchini", "rosemary", "cilantro", "ginger", 
  "bok choy", "peas", "mushroom", "parsley", "lemon", "lettuce", "spinach", "kale", 
  "celery", "corn", "broccoli", "asparagus", "snap peas"
];
const DAIRY_KEYWORDS = [
  "cheese", "milk", "cream", "butter", "sour cream", "yogurt", "monterey", 
  "parmesan", "mozzarella"
];

function categorizeIngredient(name: string): CategoryType {
  const lowerName = name.toLowerCase();
  
  if (PANTRY_KEYWORDS.some(k => lowerName.includes(k))) return "Other";
  if (PROTEIN_KEYWORDS.some(k => lowerName.includes(k))) return "Protein";
  if (GRAINS_KEYWORDS.some(k => lowerName.includes(k))) return "Grains";
  if (PRODUCE_KEYWORDS.some(k => lowerName.includes(k))) return "Produce";
  if (DAIRY_KEYWORDS.some(k => lowerName.includes(k))) return "Dairy";
  
  return "Other";
}

export default function ShoppingListTab() {
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

  const categorizedList = useMemo(() => {
    if (!list) return {};
    
    const categories: Record<CategoryType, typeof list> = {
      Protein: [],
      Grains: [],
      Produce: [],
      Dairy: [],
      Other: [],
    };
    
    list.forEach(item => {
      const category = categorizeIngredient(item.name);
      categories[category].push(item);
    });
    
    Object.keys(categories).forEach(key => {
      const cat = key as CategoryType;
      categories[cat].sort((a, b) => {
        const aChecked = checkedItems.has(a.ingredientId);
        const bChecked = checkedItems.has(b.ingredientId);
        if (aChecked === bChecked) return a.name.localeCompare(b.name);
        return aChecked ? 1 : -1;
      });
    });
    
    return categories;
  }, [list, checkedItems]);

  const totalItems = list?.length || 0;
  const categoryOrder: CategoryType[] = ["Protein", "Produce", "Grains", "Dairy", "Other"];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3 p-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading shopping list...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <ShoppingBasket className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Shopping List</h2>
            <p className="text-sm text-muted-foreground">Generated from your meal plan</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="gap-2" 
          onClick={() => window.print()}
          data-testid="button-print"
        >
          <Printer className="w-4 h-4" />
          Print
        </Button>
      </div>

      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/50 rounded-3xl bg-card/50">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-display font-bold text-foreground">Your list is empty</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            Add meals to your weekly plan to generate your shopping list automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryOrder.map(category => {
            const items = categorizedList[category];
            if (!items || items.length === 0) return null;
            
            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;

            return (
              <div key={category} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className={cn(
                  "flex items-center gap-3 px-5 py-4 border-b border-border",
                  "bg-secondary/30"
                )}>
                  <Icon className={cn("w-6 h-6", config.color)} />
                  <h3 className="text-lg font-display font-bold text-foreground">{category}</h3>
                  <span className="ml-auto text-sm text-muted-foreground">{items.length} items</span>
                </div>

                <div className="divide-y divide-border/40">
                  {items.map((item) => {
                    const isChecked = checkedItems.has(item.ingredientId);
                    return (
                      <motion.div 
                        key={item.ingredientId}
                        layout
                        className={cn(
                          "group flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors cursor-pointer select-none",
                          isChecked && "bg-muted/30"
                        )}
                        onClick={() => toggleItem(item.ingredientId)}
                        data-testid={`shopping-item-${item.ingredientId}`}
                      >
                        <div className={cn(
                          "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                          isChecked 
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "border-muted-foreground/40 group-hover:border-primary"
                        )}>
                          {isChecked && <CheckCircle2 className="w-4 h-4" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className={cn(
                              "font-medium text-base transition-all",
                              isChecked ? "text-muted-foreground line-through" : "text-foreground"
                            )}>
                              {item.name}
                            </span>
                            <span className="text-sm font-semibold bg-secondary px-2 py-1 rounded-md text-secondary-foreground">
                              {item.quantity || "as needed"}
                            </span>
                          </div>
                          
                          {!isChecked && item.recipes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
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
              </div>
            );
          })}
          
          <div className="bg-card border border-border rounded-xl p-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>{checkedItems.size} of {totalItems} items checked</span>
            {checkedItems.size > 0 && (
              <button 
                onClick={() => setCheckedItems(new Set())}
                className="text-primary hover:underline font-medium"
                data-testid="button-uncheck-all"
              >
                Uncheck all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
