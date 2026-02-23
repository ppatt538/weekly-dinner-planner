import { useState, useRef, useMemo, useEffect } from "react";
import { type RecipeWithIngredients } from "@shared/schema";
import { 
  Plus, 
  Minus,
  Clock, 
  ChefHat,
  X,
  Check,
  ImagePlus,
  Loader2,
  Users,
  Heart,
  Pencil,
  CalendarPlus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddToPlan } from "@/hooks/use-plan";
import { useUpdateRecipeImage, useUpdateRecipeServings, useToggleFavorite, useUpdateRecipe, useDeleteRecipe } from "@/hooks/use-recipes";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RecipeCardProps {
  recipe: RecipeWithIngredients;
  plannedDays?: Record<string, string>;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BASE_SERVINGS = 4;
const CUISINE_OPTIONS = ["American", "Italian", "Mexican", "Asian", "Mediterranean", "Greek", "Indian", "Middle Eastern", "Caribbean", "French", "Southern", "Southwestern"];

type IngredientInput = { name: string; quantity: string };

function scaleQuantity(quantity: string | null, baseServings: number, targetServings: number): string {
  if (!quantity) return "";
  
  const ratio = targetServings / baseServings;
  
  const match = quantity.match(/^([\d.\/]+)\s*(.*)$/);
  if (!match) return quantity;
  
  const [, numStr, unit] = match;
  
  let num: number;
  if (numStr.includes('/')) {
    const [numerator, denominator] = numStr.split('/').map(Number);
    num = numerator / denominator;
  } else {
    num = parseFloat(numStr);
  }
  
  if (isNaN(num)) return quantity;
  
  const scaled = num * ratio;
  
  let displayNum: string;
  if (scaled === Math.floor(scaled)) {
    displayNum = scaled.toString();
  } else if (scaled < 1) {
    const fractions: Record<string, string> = {
      '0.25': '1/4',
      '0.33': '1/3',
      '0.5': '1/2',
      '0.67': '2/3',
      '0.75': '3/4',
    };
    const rounded = Math.round(scaled * 100) / 100;
    displayNum = fractions[rounded.toFixed(2)] || scaled.toFixed(1);
  } else {
    displayNum = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  }
  
  return unit ? `${displayNum} ${unit}` : displayNum;
}

export function RecipeCard({ recipe, plannedDays = {} }: RecipeCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>(recipe.imageUrl || "");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [servings, setServings] = useState<number>(recipe.servings || 4);
  const inputRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState(recipe.name);
  const [editCuisine, setEditCuisine] = useState(recipe.cuisine || "American");
  const [editPrepTime, setEditPrepTime] = useState(recipe.prepTime || 30);
  const [editIngredients, setEditIngredients] = useState<IngredientInput[]>([]);
  const [editInstructions, setEditInstructions] = useState<string[]>([]);

  useEffect(() => {
    setImageUrl(recipe.imageUrl || "");
  }, [recipe.imageUrl]);

  useEffect(() => {
    setServings(recipe.servings || 4);
  }, [recipe.servings]);

  const initializeEditForm = () => {
    setEditName(recipe.name);
    setEditCuisine(recipe.cuisine || "American");
    setEditPrepTime(recipe.prepTime || 30);
    setEditIngredients(
      recipe.ingredients.length > 0
        ? recipe.ingredients.map(ing => ({ name: ing.ingredient.name, quantity: ing.quantity || "" }))
        : [{ name: "", quantity: "" }]
    );
    setEditInstructions(
      recipe.instructions && recipe.instructions.length > 0
        ? [...recipe.instructions]
        : [""]
    );
  };
  
  const { mutate: addToPlan, isPending } = useAddToPlan();
  const { mutate: toggleFavorite } = useToggleFavorite();
  const { mutate: updateImage, isPending: isUpdatingImage } = useUpdateRecipeImage();
  const { mutate: updateServings } = useUpdateRecipeServings();
  const { mutate: updateRecipe, isPending: isUpdatingRecipe } = useUpdateRecipe();
  const { mutate: deleteRecipe, isPending: isDeleting } = useDeleteRecipe();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteRecipe(recipe.id, {
      onSuccess: () => {
        toast({ title: "Recipe deleted successfully" });
        setIsDeleteDialogOpen(false);
        setIsEditOpen(false);
        setIsDetailOpen(false);
      },
      onError: () => {
        toast({ title: "Failed to delete recipe", variant: "destructive" });
      },
    });
  };

  const handleEditIngredientChange = (index: number, field: keyof IngredientInput, value: string) => {
    const updated = [...editIngredients];
    updated[index][field] = value;
    setEditIngredients(updated);
  };

  const handleAddEditIngredient = () => {
    setEditIngredients([...editIngredients, { name: "", quantity: "" }]);
  };

  const handleRemoveEditIngredient = (index: number) => {
    if (editIngredients.length > 1) {
      setEditIngredients(editIngredients.filter((_, i) => i !== index));
    }
  };

  const handleEditInstructionChange = (index: number, value: string) => {
    const updated = [...editInstructions];
    updated[index] = value;
    setEditInstructions(updated);
  };

  const handleAddEditInstruction = () => {
    setEditInstructions([...editInstructions, ""]);
  };

  const handleRemoveEditInstruction = (index: number) => {
    if (editInstructions.length > 1) {
      setEditInstructions(editInstructions.filter((_, i) => i !== index));
    }
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      toast({ title: "Recipe name is required", variant: "destructive" });
      return;
    }
    
    const filteredIngredients = editIngredients.filter(i => i.name.trim() !== "");
    const filteredInstructions = editInstructions.filter(i => i.trim() !== "");

    updateRecipe(
      {
        id: recipe.id,
        data: {
          name: editName.trim(),
          cuisine: editCuisine,
          prepTime: editPrepTime,
          ingredients: filteredIngredients,
          instructions: filteredInstructions,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Recipe updated successfully!" });
          setIsEditOpen(false);
        },
        onError: () => {
          toast({ title: "Failed to update recipe", variant: "destructive" });
        },
      }
    );
  };

  const scaledIngredients = useMemo(() => {
    return recipe.ingredients.map(ing => ({
      ...ing,
      scaledQuantity: scaleQuantity(ing.quantity, BASE_SERVINGS, servings)
    }));
  }, [recipe.ingredients, servings]);

  const handleServingsChange = (delta: number) => {
    const newServings = Math.max(1, Math.min(20, servings + delta));
    setServings(newServings);
    
    updateServings(
      { id: recipe.id, servings: newServings },
      {
        onError: () => {
          setServings(servings);
        }
      }
    );
  };

  const handleAdd = () => {
    if (!selectedDay) {
      toast({
        title: "Select a day",
        description: "Please select a day to add this meal.",
        variant: "destructive",
      });
      return;
    }
    
    addToPlan(
      { recipeId: recipe.id, day: selectedDay },
      {
        onSuccess: () => {
          toast({
            title: "Added to plan",
            description: `${recipe.name} added to ${selectedDay}'s dinner.`,
          });
          setSelectedDay("");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to add recipe to plan. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const handleImageSave = () => {
    if (!imageUrl.trim()) return;
    
    updateImage(
      { id: recipe.id, imageUrl: imageUrl.trim() },
      {
        onSuccess: () => {
          toast({
            title: "Image updated",
            description: "Recipe image has been saved.",
          });
          setShowUrlInput(false);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to save image. Please try again.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const gradientIndex = recipe.id % 4;
  const gradients = [
    "from-orange-100 to-orange-50",
    "from-green-100 to-green-50",
    "from-blue-100 to-blue-50",
    "from-amber-100 to-amber-50",
  ];

  const displayImageUrl = recipe.imageUrl || imageUrl;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsDetailOpen(true)}
        className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full cursor-pointer"
        data-testid={`recipe-card-${recipe.id}`}
      >
        <div className={cn(
          "h-40 relative p-4 flex flex-col justify-between",
          !displayImageUrl && `bg-gradient-to-br ${gradients[gradientIndex]}`
        )}>
          {displayImageUrl ? (
            <img 
              src={displayImageUrl} 
              alt={recipe.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-foreground shadow-sm">
              <ChefHat className="w-3.5 h-3.5 text-primary" />
              {recipe.cuisine || "American"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(recipe.id);
              }}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              data-testid={`button-favorite-${recipe.id}`}
            >
              <Heart 
                className={cn(
                  "w-4 h-4 transition-colors",
                  recipe.isFavorite 
                    ? "fill-red-500 text-red-500" 
                    : "text-muted-foreground hover:text-red-400"
                )} 
              />
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-display font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
            {recipe.name}
          </h3>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{recipe.prepTime || 30} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{recipe.servings || 2} servings</span>
            </div>
          </div>
          
          <div className="mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 transition-colors"
                  data-testid={`button-add-to-plan-${recipe.id}`}
                >
                  <CalendarPlus className="w-4 h-4" />
                  Add to Plan
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                {DAYS.map((day) => {
                  const existingRecipe = plannedDays[day];
                  const isPlanned = !!existingRecipe;
                  
                  return (
                    <DropdownMenuItem
                      key={day}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToPlan(
                          { recipeId: recipe.id, day },
                          {
                            onSuccess: () => {
                              toast({
                                title: isPlanned ? "Meal replaced" : "Added to plan",
                                description: isPlanned 
                                  ? `${recipe.name} replaced ${existingRecipe} on ${day}.`
                                  : `${recipe.name} added to ${day}'s dinner.`,
                              });
                            },
                            onError: () => {
                              toast({
                                title: "Error",
                                description: "Failed to add recipe to plan.",
                                variant: "destructive",
                              });
                            }
                          }
                        );
                      }}
                      className="cursor-pointer"
                      data-testid={`menu-item-${day.toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{day}</span>
                        {isPlanned && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {existingRecipe}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <button 
            onClick={() => setIsDetailOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-20"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className={cn(
            "h-56 -mx-6 -mt-6 mb-6 relative flex items-end p-6",
            !displayImageUrl && `bg-gradient-to-br ${gradients[gradientIndex]}`
          )}>
            {displayImageUrl ? (
              <img 
                src={displayImageUrl} 
                alt={recipe.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                data-testid="button-add-image"
              >
                <ImagePlus className="w-5 h-5 text-primary" />
              </button>
              <button
                onClick={() => {
                  initializeEditForm();
                  setIsEditOpen(true);
                }}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                data-testid={`button-edit-recipe-${recipe.id}`}
              >
                <Pencil className="w-5 h-5 text-primary" />
              </button>
            </div>

            {showUrlInput && (
              <div 
                className="absolute top-16 left-4 right-4 bg-white rounded-lg shadow-lg p-3 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-image-url"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleImageSave}
                    disabled={isUpdatingImage || !imageUrl.trim()}
                    data-testid="button-save-image"
                  >
                    {isUpdatingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogHeader className="text-left">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-2xl font-display">{recipe.name}</DialogTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 gap-2"
                    data-testid="button-add-to-plan-header"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Add to Plan
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {DAYS.map((day) => {
                    const existingRecipe = plannedDays[day];
                    const isPlanned = !!existingRecipe;
                    
                    return (
                      <DropdownMenuItem
                        key={day}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToPlan(
                            { recipeId: recipe.id, day },
                            {
                              onSuccess: () => {
                                toast({
                                  title: isPlanned ? "Meal replaced" : "Added to plan",
                                  description: isPlanned 
                                    ? `${recipe.name} replaced ${existingRecipe} on ${day}.`
                                    : `${recipe.name} added to ${day}'s dinner.`,
                                });
                              },
                              onError: () => {
                                toast({
                                  title: "Error",
                                  description: "Failed to add recipe to plan.",
                                  variant: "destructive",
                                });
                              }
                            }
                          );
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{day}</span>
                          {isPlanned && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {existingRecipe}
                            </span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-3 my-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">
              <ChefHat className="w-4 h-4 text-primary" />
              {recipe.cuisine || "American"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">
              <Clock className="w-4 h-4 text-primary" />
              {recipe.prepTime || 30} min
            </span>
            
            <div className="flex items-center gap-2 ml-auto">
              <Users className="w-4 h-4 text-primary" />
              <div className="flex items-center gap-1 bg-secondary rounded-full">
                <button
                  onClick={() => handleServingsChange(-1)}
                  disabled={servings <= 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  data-testid="button-decrease-servings"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-sm" data-testid="text-servings">
                  {servings}
                </span>
                <button
                  onClick={() => handleServingsChange(1)}
                  disabled={servings >= 20}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  data-testid="button-increase-servings"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">servings</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-bold text-primary mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {scaledIngredients.map((ing) => (
                  <li 
                    key={ing.id} 
                    className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg text-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span className="font-medium">{ing.ingredient.name}</span>
                    {ing.scaledQuantity && (
                      <span className="ml-auto text-muted-foreground font-mono">
                        {ing.scaledQuantity}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {recipe.instructions && recipe.instructions.length > 0 && (
              <div>
                <h3 className="text-lg font-display font-bold text-primary mb-3">Instructions</h3>
                <ol className="space-y-2 list-decimal list-inside">
                  {recipe.instructions.map((step, index) => (
                    <li 
                      key={index} 
                      className="p-3 bg-secondary/30 rounded-lg text-sm leading-relaxed"
                    >
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="bg-secondary/30 p-5 rounded-2xl">
              <h3 className="text-lg font-display font-bold mb-4">Add to Meal Plan</h3>
              
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="w-full mb-4" data-testid="select-day">
                  <SelectValue placeholder="Select a day..." />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => {
                    const existingRecipe = plannedDays[day];
                    const isPlanned = !!existingRecipe;
                    
                    return (
                      <SelectItem 
                        key={day} 
                        value={day}
                      >
                        <div className="flex items-center gap-2">
                          <span>{day}</span>
                          {isPlanned && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              ({existingRecipe})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleAdd} 
                disabled={isPending || !selectedDay}
                className="w-full"
                size="lg"
                data-testid="button-confirm-add"
              >
                {isPending ? (plannedDays[selectedDay] ? "Replacing..." : "Adding...") : (plannedDays[selectedDay] ? "Replace Meal" : "Add to Plan")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Recipe</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-recipe-name">Recipe Name *</Label>
                <Input
                  id="edit-recipe-name"
                  placeholder="e.g., Chicken Parmesan"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  data-testid="input-edit-recipe-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cuisine">Cuisine</Label>
                <Select value={editCuisine} onValueChange={setEditCuisine}>
                  <SelectTrigger id="edit-cuisine" data-testid="select-edit-cuisine">
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

            <div className="space-y-2">
              <Label htmlFor="edit-prep-time">Prep Time (minutes)</Label>
              <Input
                id="edit-prep-time"
                type="number"
                min="1"
                max="180"
                value={editPrepTime}
                onChange={(e) => setEditPrepTime(parseInt(e.target.value) || 30)}
                className="w-32"
                data-testid="input-edit-prep-time"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ingredients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEditIngredient}
                  data-testid="button-add-edit-ingredient"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Ingredient
                </Button>
              </div>
              <div className="space-y-2">
                {editIngredients.map((ing, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Quantity"
                      value={ing.quantity}
                      onChange={(e) => handleEditIngredientChange(index, "quantity", e.target.value)}
                      className="w-32"
                      data-testid={`input-edit-ingredient-quantity-${index}`}
                    />
                    <Input
                      placeholder="Ingredient name"
                      value={ing.name}
                      onChange={(e) => handleEditIngredientChange(index, "name", e.target.value)}
                      className="flex-1"
                      data-testid={`input-edit-ingredient-name-${index}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEditIngredient(index)}
                      disabled={editIngredients.length === 1}
                      data-testid={`button-remove-edit-ingredient-${index}`}
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
                  onClick={handleAddEditInstruction}
                  data-testid="button-add-edit-instruction"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Step
                </Button>
              </div>
              <div className="space-y-2">
                {editInstructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="mt-2 text-sm text-muted-foreground font-medium w-6">{index + 1}.</span>
                    <Textarea
                      placeholder={`Step ${index + 1}...`}
                      value={instruction}
                      onChange={(e) => handleEditInstructionChange(index, e.target.value)}
                      className="flex-1 min-h-[60px]"
                      data-testid={`input-edit-instruction-${index}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEditInstruction(index)}
                      disabled={editInstructions.length === 1}
                      data-testid={`button-remove-edit-instruction-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                data-testid="button-delete-recipe"
              >
                Delete Recipe
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isUpdatingRecipe}
                  data-testid="button-save-edit"
                >
                  {isUpdatingRecipe ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this recipe?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{recipe.name}" and remove it from any meal plans. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-confirm-delete"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
