import { useState } from "react";
import { Plus, Calendar, RotateCcw } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { SearchModal } from "@/components/SearchModal";
import { MealCard } from "@/components/MealCard";
import { useMealPlans, useClearMealPlans } from "@/hooks/use-meal-plans";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Home() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { data: mealPlans, isLoading } = useMealPlans();
  const { mutate: clearWeek, isPending: isClearing } = useClearMealPlans();

  const handleAddClick = (day: string) => {
    setSelectedDay(day);
    setIsSearchOpen(true);
  };

  const getMealsForDay = (day: string) => {
    return mealPlans?.filter((plan: any) => plan.day === day) || [];
  };

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-2">
              Weekly Menu
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Plan your meals for the week. Search for recipes by name, ingredient, or cuisine.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {mealPlans && mealPlans.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30">
                    <RotateCcw className="w-4 h-4" />
                    Clear Week
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear weekly plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all meals from your schedule. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => clearWeek()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isClearing ? "Clearing..." : "Yes, Clear All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {DAYS.map((day) => (
              <div key={day} className="h-64 rounded-2xl bg-white/50 border border-dashed border-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {DAYS.map((day) => {
              const meals = getMealsForDay(day);
              const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
              
              return (
                <div 
                  key={day} 
                  className={cn(
                    "flex flex-col rounded-2xl p-4 min-h-[300px] transition-all duration-300",
                    isToday 
                      ? "bg-white ring-2 ring-primary/20 shadow-lg shadow-primary/5" 
                      : "bg-white/60 border border-border/40 hover:bg-white hover:shadow-md"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={cn(
                      "font-display font-bold text-xl",
                      isToday ? "text-primary" : "text-foreground"
                    )}>
                      {day}
                      {isToday && <span className="ml-2 text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">Today</span>}
                    </h3>
                    <div className="bg-stone-100 p-1.5 rounded-lg">
                      <Calendar className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    {meals.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-border/50 rounded-xl">
                        <p className="text-sm text-muted-foreground mb-3">No meals planned</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAddClick(day)}
                          className="text-primary hover:text-primary hover:bg-primary/5 font-medium"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Meal
                        </Button>
                      </div>
                    ) : (
                      <>
                        {meals.map((meal: any) => (
                          <MealCard key={meal.id} mealPlan={meal} />
                        ))}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleAddClick(day)}
                          className="w-full mt-2 text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 h-10"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Another
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <SearchModal 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen} 
        targetDay={selectedDay} 
      />
    </div>
  );
}
