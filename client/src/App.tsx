import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UtensilsCrossed, BookOpen, CalendarDays, ShoppingCart, Heart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import RecipesTab from "@/pages/RecipesTab";
import MealPlanTab from "@/pages/MealPlanTab";
import ShoppingListTab from "@/pages/ShoppingListTab";
import headerBg from "@assets/Meal_Planner_backround_1769291639096.png";

type TabType = "recipes" | "mealplan" | "shopping";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("recipes");

  const tabs = [
    { id: "recipes" as const, label: "Recipes", icon: BookOpen },
    { id: "mealplan" as const, label: "Meal Plan", icon: CalendarDays },
    { id: "shopping" as const, label: "Shopping List", icon: ShoppingCart },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <header 
            className="relative text-white py-6 px-4 text-center shadow-lg overflow-hidden"
            style={{ 
              backgroundImage: `url(${headerBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
            <div className="relative z-10 flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white">What's for Dinner</h1>
            </div>
            <div className="relative z-10 flex items-center justify-center gap-6">
              <p className="text-white/80 text-sm">Plan your meals, create shopping lists, and add to calendar</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                    data-testid="button-love-heart"
                  >
                    <Heart className="w-3 h-3 text-white fill-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-sm">
                  Made for Luisa, with love.
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          <nav className="flex bg-card border-b border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-4 font-semibold text-sm md:text-base transition-all border-b-3",
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary bg-white"
                    : "text-muted-foreground border-b-2 border-transparent hover:bg-secondary/50"
                )}
              >
                <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          <main className="flex-1">
            {activeTab === "recipes" && <RecipesTab />}
            {activeTab === "mealplan" && <MealPlanTab />}
            {activeTab === "shopping" && <ShoppingListTab />}
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
