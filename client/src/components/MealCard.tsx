import { Trash2 } from "lucide-react";
import { type MealPlanWithRecipe } from "@shared/schema";
import { useDeleteMealPlan } from "@/hooks/use-meal-plans";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface MealCardProps {
  mealPlan: MealPlanWithRecipe;
}

export function MealCard({ mealPlan }: MealCardProps) {
  const { mutate: deleteMeal, isPending: isDeleting } = useDeleteMealPlan();
  const { toast } = useToast();

  const handleDelete = () => {
    deleteMeal(mealPlan.id, {
      onSuccess: () => {
        toast({
          title: "Meal removed",
          description: "Meal removed from your plan",
        });
      },
    });
  };

  return (
    <div className="group relative bg-white p-4 rounded-xl shadow-sm border border-border/60 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300">
      <div className="pr-6">
        <h4 className="font-display font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
          {mealPlan.recipe.name}
        </h4>
        {mealPlan.recipe.cuisine && (
          <Badge variant="outline" className="text-[10px] h-5 px-2 bg-slate-50 text-slate-600 border-slate-200">
            {mealPlan.recipe.cuisine}
          </Badge>
        )}
      </div>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-3 right-3 text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Remove meal"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      
      {/* Decorative gradient bar on the left */}
      <div className="absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-primary/50 to-primary rounded-r-full" />
    </div>
  );
}
