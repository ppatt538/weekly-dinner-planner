import { Link, useLocation } from "wouter";
import { UtensilsCrossed, ShoppingBasket, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Meal Plan", icon: CalendarDays },
    { href: "/shopping-list", label: "Shopping List", icon: ShoppingBasket },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-border/40 relative">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl leading-none text-white tracking-tight">What's for Dinner</span>
        </Link>

        <nav className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "animate-pulse" : "")} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
