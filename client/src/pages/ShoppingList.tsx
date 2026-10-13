import { Navigation } from "@/components/Navigation";
import { useShoppingList } from "@/hooks/use-shopping-list";
import { Loader2, CheckCircle2, ShoppingCart, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ShoppingList() {
  const { data: items, isLoading } = useShoppingList();

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-10">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Planner
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="bg-secondary/10 p-3 rounded-2xl">
              <ShoppingCart className="w-8 h-8 text-secondary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-4xl text-foreground">
                Shopping List
              </h1>
              <p className="text-muted-foreground mt-1">
                Aggregated ingredients from your weekly meal plan
              </p>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating list...</p>
          </div>
        ) : !items || items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-border/50 shadow-sm">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingShoppingCart className="w-10 h-10 text-stone-300" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-2">Your list is empty</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Add some meals to your weekly plan to automatically generate your shopping list.
            </p>
            <Link href="/">
              <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90">
                Go to Planner
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-border/60 overflow-hidden">
            <div className="bg-stone-50/80 px-6 py-4 border-b border-border/60 flex justify-between items-center">
              <span className="font-medium text-stone-500 text-sm uppercase tracking-wider">
                {items.length} Items to Buy
              </span>
              <Button variant="ghost" size="sm" onClick={() => window.print()} className="text-primary hover:bg-primary/10">
                Print List
              </Button>
            </div>
            
            <ul className="divide-y divide-border/40">
              {items.map((item, index) => (
                <li 
                  key={index} 
                  className="group flex items-start gap-4 p-5 hover:bg-stone-50/50 transition-colors"
                >
                  <button className="mt-1 w-5 h-5 rounded-full border-2 border-stone-300 hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-transparent group-active:text-primary" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline gap-4">
                      <span className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {item.ingredient}
                      </span>
                      <span className="font-mono text-sm text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                        {item.quantity}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      Used in {item.recipeCount} {item.recipeCount === 1 ? 'recipe' : 'recipes'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper component for empty state icon
function ShoppingShoppingCart(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}
