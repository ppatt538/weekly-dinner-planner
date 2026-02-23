import { db } from "./db";
import {
  recipes,
  ingredients,
  recipeIngredients,
  weeklyPlan,
  type Recipe,
  type Ingredient,
  type WeeklyPlanItem,
  type CreateWeeklyPlanRequest,
  type RecipeWithIngredients,
  type WeeklyPlanItemWithRecipe,
  type ShoppingListResponse
} from "@shared/schema";
import { eq } from "drizzle-orm";

export type CreateRecipeInput = {
  name: string;
  cuisine?: string;
  prepTime?: number;
  instructions?: string[];
  ingredients?: { name: string; quantity?: string }[];
};

export interface IStorage {
  // Recipes
  getRecipes(search?: string): Promise<RecipeWithIngredients[]>;
  getRecipe(id: number): Promise<RecipeWithIngredients | undefined>;
  createRecipe(name: string, cuisine?: string): Promise<Recipe>;
  createFullRecipe(input: CreateRecipeInput): Promise<RecipeWithIngredients>;
  updateFullRecipe(id: number, input: CreateRecipeInput): Promise<RecipeWithIngredients | undefined>;
  deleteRecipe(id: number): Promise<boolean>;
  updateRecipeCuisine(id: number, cuisine: string): Promise<void>;
  updateRecipeImage(id: number, imageUrl: string): Promise<Recipe>;
  updateRecipeServings(id: number, servings: number): Promise<Recipe>;
  updateRecipeInstructions(id: number, instructions: string[]): Promise<Recipe>;
  toggleFavorite(id: number): Promise<Recipe>;
  createIngredient(name: string): Promise<Ingredient>;
  linkIngredientToRecipe(recipeId: number, ingredientId: number, quantity: string): Promise<void>;
  
  // Plan
  getWeeklyPlan(): Promise<WeeklyPlanItemWithRecipe[]>;
  addToPlan(plan: CreateWeeklyPlanRequest): Promise<WeeklyPlanItem>;
  removeFromPlan(id: number): Promise<void>;
  clearPlan(): Promise<void>;
  
  // Shopping List
  getShoppingList(): Promise<ShoppingListResponse>;
}

export class DatabaseStorage implements IStorage {
  async getRecipes(search?: string): Promise<RecipeWithIngredients[]> {
    // This is a simplified fetch. For production, Drizzle's query builder with `with` is better.
    // However, we need to manually construct the RecipeWithIngredients for now or use query.
    
    const allRecipes = await db.query.recipes.findMany({
      with: {
        ingredients: {
          with: {
            ingredient: true
          }
        }
      },
      where: (recipes, { ilike, or }) => search ? or(ilike(recipes.name, `%${search}%`)) : undefined,
    });
    
    return allRecipes;
  }

  async getRecipe(id: number): Promise<RecipeWithIngredients | undefined> {
    return await db.query.recipes.findFirst({
      where: eq(recipes.id, id),
      with: {
        ingredients: {
          with: {
            ingredient: true
          }
        }
      }
    });
  }

  async createRecipe(name: string, cuisine?: string): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values({ name, cuisine }).returning();
    return recipe;
  }

  async createFullRecipe(input: CreateRecipeInput): Promise<RecipeWithIngredients> {
    const [recipe] = await db.insert(recipes).values({
      name: input.name,
      cuisine: input.cuisine || "American",
      instructions: input.instructions || [],
      servings: 4,
    }).returning();

    if (input.ingredients && input.ingredients.length > 0) {
      for (const ing of input.ingredients) {
        const ingredient = await this.createIngredient(ing.name);
        await this.linkIngredientToRecipe(recipe.id, ingredient.id, ing.quantity || "");
      }
    }

    const fullRecipe = await this.getRecipe(recipe.id);
    return fullRecipe!;
  }

  async updateFullRecipe(id: number, input: CreateRecipeInput): Promise<RecipeWithIngredients | undefined> {
    const existing = await this.getRecipe(id);
    if (!existing) return undefined;

    await db.update(recipes).set({
      name: input.name,
      cuisine: input.cuisine || existing.cuisine,
      prepTime: input.prepTime ?? existing.prepTime,
      instructions: input.instructions || existing.instructions,
    }).where(eq(recipes.id, id));

    if (input.ingredients) {
      await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
      
      for (const ing of input.ingredients) {
        if (ing.name.trim()) {
          const ingredient = await this.createIngredient(ing.name);
          await this.linkIngredientToRecipe(id, ingredient.id, ing.quantity || "");
        }
      }
    }

    return await this.getRecipe(id);
  }

  async deleteRecipe(id: number): Promise<boolean> {
    const existing = await this.getRecipe(id);
    if (!existing) return false;

    await db.delete(weeklyPlan).where(eq(weeklyPlan.recipeId, id));
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
    await db.delete(recipes).where(eq(recipes.id, id));
    
    return true;
  }

  async updateRecipeCuisine(id: number, cuisine: string): Promise<void> {
    await db.update(recipes).set({ cuisine }).where(eq(recipes.id, id));
  }

  async updateRecipeImage(id: number, imageUrl: string): Promise<Recipe> {
    const [recipe] = await db.update(recipes).set({ imageUrl }).where(eq(recipes.id, id)).returning();
    return recipe;
  }

  async updateRecipeServings(id: number, servings: number): Promise<Recipe> {
    const [recipe] = await db.update(recipes).set({ servings }).where(eq(recipes.id, id)).returning();
    return recipe;
  }

  async updateRecipeInstructions(id: number, instructions: string[]): Promise<Recipe> {
    const [recipe] = await db.update(recipes).set({ instructions }).where(eq(recipes.id, id)).returning();
    return recipe;
  }

  async toggleFavorite(id: number): Promise<Recipe> {
    const existing = await db.query.recipes.findFirst({ where: eq(recipes.id, id) });
    const newValue = !existing?.isFavorite;
    const [recipe] = await db.update(recipes).set({ isFavorite: newValue }).where(eq(recipes.id, id)).returning();
    return recipe;
  }

  async createIngredient(name: string): Promise<Ingredient> {
    // Check if exists first
    const existing = await db.query.ingredients.findFirst({
      where: eq(ingredients.name, name)
    });
    if (existing) return existing;

    const [ingredient] = await db.insert(ingredients).values({ name }).returning();
    return ingredient;
  }

  async linkIngredientToRecipe(recipeId: number, ingredientId: number, quantity: string): Promise<void> {
    await db.insert(recipeIngredients).values({
      recipeId,
      ingredientId,
      quantity
    });
  }

  async getWeeklyPlan(): Promise<WeeklyPlanItemWithRecipe[]> {
    return await db.query.weeklyPlan.findMany({
      with: {
        recipe: {
          with: {
            ingredients: {
              with: {
                ingredient: true
              }
            }
          }
        }
      }
    });
  }

  async addToPlan(plan: CreateWeeklyPlanRequest): Promise<WeeklyPlanItem> {
    // First, remove any existing meal for this day (to allow replacing)
    await db.delete(weeklyPlan).where(eq(weeklyPlan.day, plan.day));
    
    // Then insert the new plan
    const [item] = await db.insert(weeklyPlan).values(plan).returning();
    return item;
  }

  async removeFromPlan(id: number): Promise<void> {
    await db.delete(weeklyPlan).where(eq(weeklyPlan.id, id));
  }
  
  async clearPlan(): Promise<void> {
    await db.delete(weeklyPlan);
  }

  async getShoppingList(): Promise<ShoppingListResponse> {
    const plan = await this.getWeeklyPlan();
    const list: Record<number, { name: string, quantity: string[], recipes: string[] }> = {};

    for (const item of plan) {
      for (const ri of item.recipe.ingredients) {
        if (!list[ri.ingredientId]) {
          list[ri.ingredientId] = {
            name: ri.ingredient.name,
            quantity: [],
            recipes: []
          };
        }
        
        // Simple aggregation logic: just list them. "2 onions, 1 onion"
        if (ri.quantity) {
          list[ri.ingredientId].quantity.push(ri.quantity);
        }
        if (!list[ri.ingredientId].recipes.includes(item.recipe.name)) {
          list[ri.ingredientId].recipes.push(item.recipe.name);
        }
      }
    }

    return Object.entries(list).map(([id, data]) => ({
      ingredientId: Number(id),
      name: data.name,
      quantity: data.quantity.join(" + "), // Simple aggregation
      recipes: data.recipes
    }));
  }
}

export const storage = new DatabaseStorage();
