import { useState } from "react";
import { useRecipes } from "@/hooks/use-recipes";
import { useWeeklyPlan, useClearPlan } from "@/hooks/use-plan";
import { Header } from "@/components/Header";
import { RecipeCard } from "@/components/RecipeCard";
import { DayColumn } from "@/components/DayColumn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, Loader2, Sparkles } from "lucide-react";
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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Home() {
  const [search, setSearch] = useState("");
  const { data: recipes, isLoading: loadingRecipes } = useRecipes(search);
  const { data: plan, isLoading: loadingPlan } = useWeeklyPlan();
  const { mutate: clearPlan, isPending: clearingPlan } = useClearPlan();

  const currentDayName = format(new Date(), "EEEE");

  // Helper to get items for a specific day
  const getItemsForDay = (day: string) => {
    return plan?.filter((item) => item.day === day) || [];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Weekly Calendar */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Weekly Menu</h1>
              <p className="text-muted-foreground">Plan your meals for the week ahead.</p>
            </div>
            
            {plan && plan.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Week
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear weekly plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all meals from your current week's schedule. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => clearPlan()}
                      className="bg-destructive hover:bg-destructive/90 text-white"
                      disabled={clearingPlan}
                    >
                      {clearingPlan ? "Clearing..." : "Yes, Clear All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {loadingPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[...Array(4)].map((_, i) => (
                 <div key={i} className="h-48 rounded-2xl bg-muted/30 animate-pulse" />
               ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DAYS.map((day) => (
                <DayColumn 
                  key={day} 
                  day={day} 
                  items={getItemsForDay(day)} 
                  isToday={day === currentDayName}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recipe Search */}
        <div className="lg:col-span-5 flex flex-col h-[calc(100vh-8rem)] sticky top-24">
          <div className="bg-card border border-border/50 rounded-2xl shadow-lg shadow-black/5 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Recipe Book
                </h2>
                <span className="text-xs font-medium bg-white px-2 py-1 rounded-full border shadow-sm">
                  {recipes?.length || 0} Recipes
                </span>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, ingredient, or cuisine..." 
                  className="pl-9 bg-white border-border/60 focus:ring-primary/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              {loadingRecipes ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-muted-foreground text-sm">Loading kitchen...</span>
                </div>
              ) : recipes?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No recipes found matching "{search}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {recipes?.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
