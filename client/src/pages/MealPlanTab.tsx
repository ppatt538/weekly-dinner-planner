import { useState } from "react";
import { useWeeklyPlan, useClearPlan, useRemoveFromPlan } from "@/hooks/use-plan";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, CalendarPlus, Users, Clock, ChefHat } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Recipe, RecipeIngredient } from "@shared/schema";

const ALL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type RecipeWithIngredients = Recipe & { ingredients: (RecipeIngredient & { ingredient: { id: number; name: string } })[] };

export default function MealPlanTab() {
  const { data: plan, isLoading } = useWeeklyPlan();
  const { mutate: clearPlan, isPending: clearingPlan } = useClearPlan();
  const { mutate: removeFromPlan, isPending: removing } = useRemoveFromPlan();
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null);

  const currentDayName = format(new Date(), "EEEE");
  const todayIndex = ALL_DAYS.indexOf(currentDayName);
  const DAYS = [...ALL_DAYS.slice(todayIndex), ...ALL_DAYS.slice(0, todayIndex)];

  const getItemsForDay = (day: string) => {
    return plan?.filter((item) => item.day === day) || [];
  };

  const generateICSFile = (events: { day: string; recipe: any }[]) => {
    const icsEvents = events.map(({ day, recipe }) => {
      const nextDate = getNextDate(day);
      const startTime = format(nextDate, "yyyyMMdd") + "T180000";
      const endTime = format(nextDate, "yyyyMMdd") + "T190000";
      
      const servings = recipe.servings || 4;
      const ingredientsList = recipe.ingredients && recipe.ingredients.length > 0
        ? recipe.ingredients.map((ing: any) => `- ${ing.quantity} ${ing.ingredient.name}`).join("\\n")
        : "No ingredients listed";
      
      const instructionsList = recipe.instructions && recipe.instructions.length > 0
        ? recipe.instructions.map((step: string, i: number) => `${i + 1}. ${step}`).join("\\n")
        : "Follow recipe directions";
      
      const description = `Servings: ${servings}\\n\\nIngredients:\\n${ingredientsList}\\n\\nInstructions:\\n${instructionsList}`;
      
      const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@whatsfordinner`;
      
      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:Dinner - ${recipe.name}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT"
      ].join("\r\n");
    });

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//What's for Dinner//Meal Planner//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...icsEvents,
      "END:VCALENDAR"
    ].join("\r\n");

    return icsContent;
  };

  const downloadICS = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddToCalendar = (day: string, recipe: typeof plan extends (infer T)[] ? T extends { recipe: infer R } ? R : never : never) => {
    const icsContent = generateICSFile([{ day, recipe }]);
    const safeRecipeName = recipe.name.replace(/[^a-zA-Z0-9]/g, "_");
    downloadICS(icsContent, `${day}_${safeRecipeName}.ics`);
  };

  const handleAddWeekToCalendar = () => {
    if (!plan || plan.length === 0) return;
    const events = plan.map(item => ({ day: item.day, recipe: item.recipe }));
    const icsContent = generateICSFile(events);
    downloadICS(icsContent, "weekly_meal_plan.ics");
  };

  const getNextDate = (dayName: string): Date => {
    const today = new Date();
    const targetDay = ALL_DAYS.indexOf(dayName);
    const todayDay = today.getDay();
    let diff = targetDay - todayDay;
    if (diff < 0) diff += 7;
    const result = new Date(today);
    result.setDate(today.getDate() + diff);
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3 p-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading meal plan...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">Weekly Meal Plan</h2>
        
        {plan && plan.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear entire week?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all meals from your weekly plan. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => clearPlan()}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={clearingPlan}
                >
                  {clearingPlan ? "Clearing..." : "Clear All"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS.map((day) => {
          const items = getItemsForDay(day);
          const isToday = day === currentDayName;

          return (
            <div
              key={day}
              data-testid={`day-card-${day.toLowerCase()}`}
              className={cn(
                "bg-card border-2 rounded-2xl p-4 transition-all",
                isToday ? "border-primary shadow-lg shadow-primary/10" : "border-border/50 hover:border-primary/30"
              )}
            >
              <h3 className={cn(
                "text-lg font-display font-bold text-center mb-4 pb-2 border-b",
                isToday ? "text-primary border-primary/30" : "text-foreground border-border/50"
              )}>
                {day}
                {isToday && <span className="ml-2 text-xs font-normal bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Today</span>}
              </h3>

              {items.length === 0 ? (
                <div className="h-24 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center text-muted-foreground italic text-sm">
                  No meal planned
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="bg-secondary/30 rounded-xl p-3">
                      <button
                        className="w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedRecipe(item.recipe as RecipeWithIngredients)}
                        data-testid={`button-view-recipe-${item.id}`}
                      >
                        <p className="font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">{item.recipe.name}</p>
                        <p className="text-xs text-muted-foreground mb-3">{item.recipe.cuisine}</p>
                      </button>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="flex-1 h-8 text-xs"
                          onClick={() => removeFromPlan(item.id)}
                          disabled={removing}
                          data-testid={`button-remove-${item.id}`}
                        >
                          Remove
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 h-8 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900"
                        onClick={() => handleAddToCalendar(day, item.recipe)}
                        data-testid={`button-calendar-${item.id}`}
                      >
                        <CalendarPlus className="w-3 h-3 mr-1" />
                        Add to Calendar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {plan && plan.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
            onClick={handleAddWeekToCalendar}
            data-testid="button-add-week-calendar"
          >
            <CalendarPlus className="w-5 h-5 mr-2" />
            Add Entire Week to Calendar
          </Button>
        </div>
      )}

      <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogDescription className="sr-only">Recipe details and cooking instructions</DialogDescription>
          {selectedRecipe && (
            <>
              {selectedRecipe.imageUrl && (
                <div className="relative w-full h-48 -mt-6 -mx-6 mb-4" style={{ width: 'calc(100% + 48px)' }}>
                  <img
                    src={selectedRecipe.imageUrl}
                    alt={selectedRecipe.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}
              
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-display">{selectedRecipe.name}</DialogTitle>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <ChefHat className="w-4 h-4" />
                    {selectedRecipe.cuisine}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedRecipe.servings} servings
                  </span>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    Ingredients
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRecipe.ingredients?.map((ing, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>
                          <span className="font-medium">{ing.quantity}</span> {ing.ingredient.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Instructions
                  </h4>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions?.map((step, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
