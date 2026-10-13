import { Link, useLocation } from "wouter";
import { Utensils, ShoppingBasket } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location === path;
    return `
      flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200
      ${isActive 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-y-[-1px]" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"}
    `;
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-gradient-to-br from-primary to-green-600 p-2 rounded-lg group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              Dinner<span className="text-primary">Planner</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/" className={getLinkClass("/")}>
              <span className="hidden sm:inline">Weekly Plan</span>
              <span className="sm:hidden">Plan</span>
            </Link>
            <Link href="/shopping-list" className={getLinkClass("/shopping-list")}>
              <ShoppingBasket className="w-4 h-4" />
              <span className="hidden sm:inline">Shopping List</span>
              <span className="sm:hidden">List</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
