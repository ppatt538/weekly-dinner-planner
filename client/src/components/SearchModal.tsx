import { useState } from "react";
import { Search, ChefHat, X, Loader2, Plus, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRecipes } from "@/hooks/use-recipes";
import { useCreateMealPlan } from "@/hooks/use-meal-plans";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDay: string | null;
}

export function SearchModal({ open, onOpenChange, targetDay }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<'name' | 'cuisine' | 'ingredient'>('name');
  const { toast } = useToast();
  
  // Debounce search could be added here, but for simplicity relying on controlled input state updates
  // In a real app with large DB, we'd debounce the query param
  
  const queryParams = searchTerm ? { 
    [selectedFilter === 'name' ? 'q' : selectedFilter]: searchTerm 
  } : undefined;

  const { data: recipes, isLoading } = useRecipes(queryParams);
  const { mutate: addMeal, isPending: isAdding } = useCreateMealPlan();

  const handleAddMeal = (recipeId: number, recipeName: string) => {
    if (!targetDay) return;
    
    addMeal(
      { day: targetDay, recipeId },
      {
        onSuccess: () => {
          toast({
            title: "Meal added!",
            description: `${recipeName} added to ${targetDay}`,
          });
          onOpenChange(false);
          setSearchTerm("");
        },
      }
    );
  };

  const cuisines = ["Italian", "Mexican", "Asian", "American", "Mediterranean", "French"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <span className="bg-secondary/20 p-2 rounded-full text-secondary">
              <ChefHat className="w-5 h-5" />
            </span>
            Add Meal for <span className="text-primary">{targetDay}</span>
          </DialogTitle>
          
          <div className="flex flex-col gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={`Search by ${selectedFilter}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-12 text-lg rounded-xl border-2 focus-visible:ring-offset-0 focus-visible:border-primary"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(['name', 'cuisine', 'ingredient'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border",
                    selectedFilter === filter
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  By {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
              
              {/* Quick cuisine filters when in cuisine mode */}
              {selectedFilter === 'cuisine' && cuisines.map(c => (
                <button
                  key={c}
                  onClick={() => setSearchTerm(c)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 whitespace-nowrap border border-transparent"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Finding delicious recipes...</p>
            </div>
          ) : recipes?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-6 h-6 opacity-50" />
              </div>
              <p>No recipes found matching "{searchTerm}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {recipes?.map((recipe) => (
                <div
                  key={recipe.id}
                  className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-display font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {recipe.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {recipe.cuisine && (
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 border-0 font-normal">
                          {recipe.cuisine}
                        </Badge>
                      )}
                      {recipe.description && (
                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {recipe.description}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleAddMeal(recipe.id, recipe.name)}
                    disabled={isAdding}
                    className="shrink-0 rounded-full h-10 w-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm group-hover:scale-105 transition-transform"
                  >
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {!searchTerm && !isLoading && recipes && (
            <div className="mt-8 p-4 rounded-xl bg-blue-50 text-blue-700 text-sm flex gap-3">
              <Info className="w-5 h-5 shrink-0" />
              <p>Try searching for ingredients like "Chicken", "Pasta", or cuisines like "Italian".</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
