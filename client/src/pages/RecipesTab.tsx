import { useState, useMemo, useRef, useEffect } from "react";
import { useRecipes } from "@/hooks/use-recipes";
import { useWeeklyPlan } from "@/hooks/use-plan";
import { RecipeCard } from "@/components/RecipeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Heart, Plus, Trash2, X, Sparkles, Image, Upload, Refrigerator, Beef, Wheat, Carrot, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AIRecipeOutput } from "@shared/schema";

type CategoryType = "Protein" | "Grains" | "Produce" | "Dairy" | "Other";
type CategorizedIngredient = { id: number; name: string; alwaysAvailable: boolean };
type CategorizedIngredients = Record<CategoryType, CategorizedIngredient[]>;

const CATEGORY_CONFIG: Record<CategoryType, { icon: typeof Beef; color: string; label: string }> = {
  Protein: { icon: Beef, color: "text-red-500", label: "Proteins" },
  Grains: { icon: Wheat, color: "text-amber-600", label: "Grains & Starches" },
  Produce: { icon: Carrot, color: "text-green-500", label: "Produce" },
  Dairy: { icon: Package, color: "text-blue-500", label: "Dairy" },
  Other: { icon: Package, color: "text-gray-500", label: "Sauces & Pantry" },
};

const CUISINES = ["All", "American", "Italian", "Mexican", "Asian", "Mediterranean", "Greek", "Indian", "Middle Eastern", "Caribbean", "French", "Southern", "Southwestern"];
const CUISINE_OPTIONS = ["American", "Italian", "Mexican", "Asian", "Mediterranean", "Greek", "Indian", "Middle Eastern", "Caribbean", "French", "Southern", "Southwestern"];

type IngredientInput = { name: string; quantity: string };

export default function RecipesTab() {
  const [search, setSearch] = useState("");
  const [activeCuisine, setActiveCuisine] = useState("All");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isFridgeDialogOpen, setIsFridgeDialogOpen] = useState(false);
  const [aiTextInput, setAITextInput] = useState("");
  const [aiImagePreview, setAIImagePreview] = useState<string | null>(null);
  const [fridgeDescription, setFridgeDescription] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [fridgeFilterActive, setFridgeFilterActive] = useState(false);
  const [activeIngredientFilter, setActiveIngredientFilter] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: recipes, isLoading } = useRecipes();
  const { data: plan } = useWeeklyPlan();
  const { toast } = useToast();

  const { data: categorizedIngredients } = useQuery<CategorizedIngredients>({
    queryKey: ["/api/ingredients"],
  });

  const allIngredientsList = useMemo(() => {
    if (!categorizedIngredients) return [];
    return Object.values(categorizedIngredients).flat();
  }, [categorizedIngredients]);

  useEffect(() => {
    if (categorizedIngredients && selectedIngredients.size === 0) {
      const alwaysAvailable = new Set<string>();
      Object.values(categorizedIngredients).flat().forEach(ing => {
        if (ing.alwaysAvailable) {
          alwaysAvailable.add(ing.name);
        }
      });
      setSelectedIngredients(alwaysAvailable);
    }
  }, [categorizedIngredients]);

  const matchIngredientsMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest("POST", "/api/ingredients/match", {
        description,
        allIngredients: allIngredientsList,
      });
      return response.json() as Promise<{ matchedIngredients: string[] }>;
    },
    onSuccess: (data) => {
      const newSelected = new Set(selectedIngredients);
      data.matchedIngredients.forEach(name => {
        const matchedIng = allIngredientsList.find(i => 
          i.name.toLowerCase() === name.toLowerCase()
        );
        if (matchedIng) {
          newSelected.add(matchedIng.name);
        }
      });
      setSelectedIngredients(newSelected);
      toast({ title: `Found ${data.matchedIngredients.length} matching ingredients!` });
      setFridgeDescription("");
    },
    onError: () => {
      toast({ title: "Failed to match ingredients", variant: "destructive" });
    },
  });

  const [newRecipeName, setNewRecipeName] = useState("");
  const [newRecipeCuisine, setNewRecipeCuisine] = useState("American");
  const [newIngredients, setNewIngredients] = useState<IngredientInput[]>([{ name: "", quantity: "" }]);
  const [newInstructions, setNewInstructions] = useState<string[]>([""]);

  const generateAIMutation = useMutation({
    mutationFn: async (data: { text?: string; imageBase64?: string }) => {
      const response = await apiRequest("POST", "/api/recipes/generate-ai", data);
      return response.json() as Promise<AIRecipeOutput>;
    },
    onSuccess: (data) => {
      setNewRecipeName(data.name || "");
      setNewRecipeCuisine(data.cuisine || "American");
      setNewIngredients(
        data.ingredients?.length > 0
          ? data.ingredients.map(i => ({ name: i.name, quantity: i.quantity }))
          : [{ name: "", quantity: "" }]
      );
      setNewInstructions(
        data.instructions?.length > 0
          ? data.instructions
          : [""]
      );
      toast({ title: "Recipe details filled by AI!" });
      setIsAIDialogOpen(false);
      setAITextInput("");
      setAIImagePreview(null);
    },
    onError: () => {
      toast({ title: "Failed to generate recipe from AI", variant: "destructive" });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAIImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAIGenerate = () => {
    if (!aiTextInput.trim() && !aiImagePreview) {
      toast({ title: "Please provide a description or upload an image", variant: "destructive" });
      return;
    }
    generateAIMutation.mutate({
      text: aiTextInput.trim() || undefined,
      imageBase64: aiImagePreview || undefined,
    });
  };

  const clearAIInput = () => {
    setAITextInput("");
    setAIImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setNewRecipeName("");
    setNewRecipeCuisine("American");
    setNewIngredients([{ name: "", quantity: "" }]);
    setNewInstructions([""]);
  };

  const createRecipeMutation = useMutation({
    mutationFn: async (data: { name: string; cuisine: string; ingredients: IngredientInput[]; instructions: string[] }) => {
      const filteredIngredients = data.ingredients.filter(i => i.name.trim() !== "");
      const filteredInstructions = data.instructions.filter(i => i.trim() !== "");
      return apiRequest("POST", "/api/recipes", {
        name: data.name,
        cuisine: data.cuisine,
        ingredients: filteredIngredients,
        instructions: filteredInstructions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Recipe created successfully!" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create recipe", variant: "destructive" });
    },
  });

  const handleAddIngredient = () => {
    setNewIngredients([...newIngredients, { name: "", quantity: "" }]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (newIngredients.length > 1) {
      setNewIngredients(newIngredients.filter((_, i) => i !== index));
    }
  };

  const handleIngredientChange = (index: number, field: keyof IngredientInput, value: string) => {
    const updated = [...newIngredients];
    updated[index][field] = value;
    setNewIngredients(updated);
  };

  const handleAddInstruction = () => {
    setNewInstructions([...newInstructions, ""]);
  };

  const handleRemoveInstruction = (index: number) => {
    if (newInstructions.length > 1) {
      setNewInstructions(newInstructions.filter((_, i) => i !== index));
    }
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...newInstructions];
    updated[index] = value;
    setNewInstructions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipeName.trim()) {
      toast({ title: "Recipe name is required", variant: "destructive" });
      return;
    }
    createRecipeMutation.mutate({
      name: newRecipeName.trim(),
      cuisine: newRecipeCuisine,
      ingredients: newIngredients,
      instructions: newInstructions,
    });
  };

  const plannedDays = useMemo(() => {
    const dayMap: Record<string, string> = {};
    plan?.forEach(item => {
      dayMap[item.day] = item.recipe.name;
    });
    return dayMap;
  }, [plan]);

  const availableCuisines = useMemo(() => {
    if (!recipes) return ["All"];
    const cuisinesWithRecipes = new Set(recipes.map(r => r.cuisine || "American"));
    return ["All", ...CUISINES.slice(1).filter(c => cuisinesWithRecipes.has(c))];
  }, [recipes]);

  const handleToggleIngredient = (name: string) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedIngredients(newSelected);
  };

  const handleApplyFridgeFilter = () => {
    setActiveIngredientFilter(new Set(selectedIngredients));
    setFridgeFilterActive(true);
    setIsFridgeDialogOpen(false);
    toast({ title: "Filtering recipes by available ingredients" });
  };

  const handleClearFridgeFilter = () => {
    setFridgeFilterActive(false);
    setActiveIngredientFilter(new Set());
  };

  const handleSelectAllCategory = (category: CategoryType) => {
    if (!categorizedIngredients) return;
    const newSelected = new Set(selectedIngredients);
    categorizedIngredients[category].forEach(ing => newSelected.add(ing.name));
    setSelectedIngredients(newSelected);
  };

  const handleClearCategory = (category: CategoryType) => {
    if (!categorizedIngredients) return;
    const newSelected = new Set(selectedIngredients);
    categorizedIngredients[category].forEach(ing => {
      if (!ing.alwaysAvailable) {
        newSelected.delete(ing.name);
      }
    });
    setSelectedIngredients(newSelected);
  };

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    
    let filtered = [...recipes];
    
    if (showFavoritesOnly) {
      filtered = filtered.filter(r => r.isFavorite);
    }
    
    if (activeCuisine !== "All") {
      filtered = filtered.filter(r => r.cuisine === activeCuisine);
    }
    
    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(term) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(term)) ||
        r.ingredients.some(ing => ing.ingredient.name.toLowerCase().includes(term))
      );
    }

    if (fridgeFilterActive && activeIngredientFilter.size > 0) {
      filtered = filtered.filter(recipe => {
        const recipeIngNames = recipe.ingredients.map(i => i.ingredient.name);
        const keyIngredients = recipeIngNames.filter(name => {
          const lowerName = name.toLowerCase();
          const isProtein = ["beef", "chicken", "pork", "turkey", "steak", "sausage", "egg"].some(k => lowerName.includes(k));
          const isGrain = ["rice", "pasta", "linguine", "noodle", "tortilla", "couscous", "ramen"].some(k => lowerName.includes(k));
          const isProduce = ["onion", "pepper", "carrot", "potato", "zucchini", "bok choy", "peas", "mushroom", "cabbage", "bean"].some(k => lowerName.includes(k));
          return isProtein || isGrain || isProduce;
        });
        return keyIngredients.every(name => activeIngredientFilter.has(name));
      });
    }
    
    filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
    
    return filtered;
  }, [recipes, search, activeCuisine, showFavoritesOnly, fridgeFilterActive, activeIngredientFilter]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="space-y-4 mb-6">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              type="search"
              placeholder="Search recipes by name, cuisine, or ingredient..."
              className="pl-12 h-12 text-base rounded-full border-2 border-primary/20 focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-recipes"
            />
          </div>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="lg"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={cn(
              "rounded-full px-5 gap-2 h-12 font-semibold transition-all shrink-0",
              showFavoritesOnly
                ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                : "border-red-300 text-red-500 hover:bg-red-50"
            )}
            data-testid="filter-favorites"
          >
            <Heart className={cn("w-5 h-5", showFavoritesOnly && "fill-current")} />
            Favorites
          </Button>

          <Button
            variant={fridgeFilterActive ? "default" : "outline"}
            size="lg"
            onClick={() => fridgeFilterActive ? handleClearFridgeFilter() : setIsFridgeDialogOpen(true)}
            className={cn(
              "rounded-full px-5 gap-2 h-12 font-semibold transition-all shrink-0",
              fridgeFilterActive
                ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
                : "border-emerald-400 text-emerald-600 hover:bg-emerald-50"
            )}
            data-testid="button-whats-in-fridge"
          >
            <Refrigerator className="w-5 h-5" />
            {fridgeFilterActive ? "Clear Fridge Filter" : "What's in the Fridge"}
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="rounded-full px-5 gap-2 h-12 font-semibold shrink-0"
                data-testid="button-add-recipe"
              >
                <Plus className="w-5 h-5" />
                Add Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <DialogTitle className="text-xl font-bold">Add New Recipe</DialogTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAIDialogOpen(true)}
                    className="gap-2"
                    data-testid="button-use-ai"
                  >
                    <Sparkles className="w-4 h-4" />
                    Use AI
                  </Button>
                </div>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipe-name">Recipe Name *</Label>
                    <Input
                      id="recipe-name"
                      placeholder="e.g., Chicken Parmesan"
                      value={newRecipeName}
                      onChange={(e) => setNewRecipeName(e.target.value)}
                      data-testid="input-recipe-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuisine">Cuisine</Label>
                    <Select value={newRecipeCuisine} onValueChange={setNewRecipeCuisine}>
                      <SelectTrigger id="cuisine" data-testid="select-cuisine">
                        <SelectValue placeholder="Select cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        {CUISINE_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Ingredients</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddIngredient}
                      data-testid="button-add-ingredient"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Ingredient
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newIngredients.map((ing, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Quantity (e.g., 2 cups)"
                          value={ing.quantity}
                          onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                          className="w-32"
                          data-testid={`input-ingredient-quantity-${index}`}
                        />
                        <Input
                          placeholder="Ingredient name"
                          value={ing.name}
                          onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                          className="flex-1"
                          data-testid={`input-ingredient-name-${index}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveIngredient(index)}
                          disabled={newIngredients.length === 1}
                          data-testid={`button-remove-ingredient-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Instructions</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddInstruction}
                      data-testid="button-add-instruction"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Step
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newInstructions.map((instruction, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <span className="mt-2 text-sm text-muted-foreground font-medium w-6">{index + 1}.</span>
                        <Textarea
                          placeholder={`Step ${index + 1}...`}
                          value={instruction}
                          onChange={(e) => handleInstructionChange(index, e.target.value)}
                          className="flex-1 min-h-[60px]"
                          data-testid={`input-instruction-${index}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveInstruction(index)}
                          disabled={newInstructions.length === 1}
                          data-testid={`button-remove-instruction-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                    data-testid="button-cancel-recipe"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRecipeMutation.isPending}
                    data-testid="button-save-recipe"
                  >
                    {createRecipeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Recipe"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 flex-wrap">
          {availableCuisines.map((cuisine) => (
            <Button
              key={cuisine}
              variant="outline"
              size="sm"
              data-testid={`filter-cuisine-${cuisine.toLowerCase()}`}
              onClick={() => setActiveCuisine(cuisine)}
              className={cn(
                "rounded-full px-4 font-semibold transition-all",
                activeCuisine === cuisine
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  : "border-primary/30 text-primary hover:bg-primary/10"
              )}
            >
              {cuisine === "All" ? "All Cuisines" : cuisine}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-60 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading recipes...</span>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-6xl mb-4">
            <Search className="w-16 h-16 mx-auto opacity-50" />
          </div>
          <p className="text-lg font-medium">No recipes found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} plannedDays={plannedDays} />
          ))}
        </div>
      )}

      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate Recipe with AI
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Describe a recipe or upload an image, and AI will fill in all the details for you.
            </p>
            
            <div className="space-y-2">
              <Label>Recipe Description</Label>
              <Textarea
                placeholder="e.g., A classic Italian pasta carbonara with crispy bacon, eggs, parmesan cheese, and black pepper..."
                value={aiTextInput}
                onChange={(e) => setAITextInput(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-ai-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Or Upload an Image</Label>
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-ai-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full gap-2"
                  data-testid="button-upload-image"
                >
                  <Upload className="w-4 h-4" />
                  {aiImagePreview ? "Change Image" : "Upload Recipe Image"}
                </Button>
                
                {aiImagePreview && (
                  <div className="relative">
                    <img 
                      src={aiImagePreview} 
                      alt="Recipe preview" 
                      className="w-full h-40 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setAIImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      data-testid="button-remove-ai-image"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAIDialogOpen(false);
                  clearAIInput();
                }}
                data-testid="button-cancel-ai"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAIGenerate}
                disabled={generateAIMutation.isPending || (!aiTextInput.trim() && !aiImagePreview)}
                className="gap-2"
                data-testid="button-generate-ai"
              >
                {generateAIMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Recipe
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFridgeDialogOpen} onOpenChange={setIsFridgeDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Refrigerator className="w-5 h-5 text-emerald-500" />
              What's in the Fridge?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 bg-muted/50 rounded-lg p-3 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              Quick select with AI
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder="e.g., I have ground beef, some rice, onions and peppers..."
                value={fridgeDescription}
                onChange={(e) => setFridgeDescription(e.target.value)}
                className="min-h-[50px] flex-1 text-sm"
                data-testid="input-fridge-description"
              />
              <Button
                onClick={() => matchIngredientsMutation.mutate(fridgeDescription)}
                disabled={!fridgeDescription.trim() || matchIngredientsMutation.isPending}
                className="gap-2 shrink-0"
                size="sm"
                data-testid="button-ai-match-ingredients"
              >
                {matchIngredientsMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Match
              </Button>
            </div>
          </div>

          <div className="text-sm font-medium flex items-center justify-between shrink-0">
            <span>Available Ingredients</span>
            <span className="text-xs text-muted-foreground">Pantry items pre-selected</span>
          </div>
          
          <ScrollArea className="h-[350px] border rounded-lg p-3">
            <div className="space-y-4">
              {(["Protein", "Grains", "Produce", "Dairy", "Other"] as CategoryType[]).map((category) => {
                const config = CATEGORY_CONFIG[category];
                const Icon = config.icon;
                const ingredients = categorizedIngredients?.[category] || [];
                
                if (ingredients.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-4 h-4", config.color)} />
                        <span className="font-medium text-sm">{config.label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({ingredients.filter(i => selectedIngredients.has(i.name)).length}/{ingredients.length})
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleSelectAllCategory(category)}
                          data-testid={`button-select-all-${category.toLowerCase()}`}
                        >
                          All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleClearCategory(category)}
                          data-testid={`button-clear-${category.toLowerCase()}`}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ingredients.map((ing) => (
                        <label
                          key={ing.id}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors border",
                            selectedIngredients.has(ing.name)
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-muted/50 border-transparent hover:bg-muted"
                          )}
                        >
                          <Checkbox
                            checked={selectedIngredients.has(ing.name)}
                            onCheckedChange={() => handleToggleIngredient(ing.name)}
                            className="h-3 w-3"
                            data-testid={`checkbox-ingredient-${ing.id}`}
                          />
                          <span>{ing.name}</span>
                          {ing.alwaysAvailable && (
                            <span className="text-[10px] text-muted-foreground">(pantry)</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter className="pt-3 border-t mt-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFridgeDialogOpen(false)}
              data-testid="button-cancel-fridge"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFridgeFilter}
              className="gap-2"
              data-testid="button-apply-fridge-filter"
            >
              <Refrigerator className="w-4 h-4" />
              Filter Recipes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
