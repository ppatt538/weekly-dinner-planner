import { type WeeklyPlanItemWithRecipe } from "@shared/schema";
import { useRemoveFromPlan } from "@/hooks/use-plan";
import { X, ChefHat, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DayColumnProps {
  day: string;
  items: WeeklyPlanItemWithRecipe[];
  isToday: boolean;
}

export function DayColumn({ day, items, isToday }: DayColumnProps) {
  const { mutate: remove, isPending } = useRemoveFromPlan();

  return (
    <div className={cn(
      "flex flex-col h-full rounded-2xl border bg-card/50 transition-colors duration-300",
      isToday ? "border-primary/50 bg-primary/5 shadow-inner" : "border-border/60"
    )}>
      <div className={cn(
        "p-4 border-b flex justify-between items-center",
        isToday ? "border-primary/20" : "border-border/40"
      )}>
        <h3 className={cn(
          "font-display font-bold text-lg",
          isToday ? "text-primary" : "text-foreground"
        )}>
          {day}
        </h3>
        {isToday && (
          <span className="text-[10px] uppercase font-bold bg-primary text-white px-2 py-0.5 rounded-full">
            Today
          </span>
        )}
      </div>

      <div className="p-3 flex-1 min-h-[160px] space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2 border-2 border-dashed border-border/50 rounded-xl min-h-[120px]">
            <ChefHat className="w-8 h-8" />
            <span className="text-sm font-medium">No meals planned</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className="group relative bg-white dark:bg-card border border-border/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
              >
                <div className="pr-6">
                  <h4 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">
                    {item.recipe.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {item.recipe.ingredients.length} ingredients
                  </p>
                </div>

                <button
                  onClick={() => remove(item.id)}
                  disabled={isPending}
                  className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove meal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
