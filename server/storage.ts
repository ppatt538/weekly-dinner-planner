
import { db } from "./db";
import {
  recipes,
  ingredients,
  recipeIngredients,
  mealPlans,
  type Recipe,
  type InsertMealPlan,
  type MealPlan,
  type RecipeWithIngredients,
  type MealPlanWithRecipe,
} from "@shared/schema";
import { eq, ilike, or, and, inArray } from "drizzle-orm";

export interface IStorage {
  // Recipes
  getRecipes(query?: string, cuisine?: string, ingredient?: string): Promise<Recipe[]>;
  getRecipe(id: number): Promise<RecipeWithIngredients | undefined>;
  
  // Meal Plans
  getMealPlans(): Promise<MealPlanWithRecipe[]>;
  createMealPlan(plan: InsertMealPlan): Promise<MealPlan>;
  deleteMealPlan(id: number): Promise<void>;
  clearMealPlans(): Promise<void>;

  // Internal for seeding
  createRecipe(recipe: { name: string; cuisine?: string }): Promise<Recipe>;
  createIngredient(name: string): Promise<{ id: number; name: string }>;
  addRecipeIngredient(recipeId: number, ingredientId: number, quantity: string): Promise<void>;
  getRecipeByName(name: string): Promise<Recipe | undefined>;
  getIngredientByName(name: string): Promise<{ id: number; name: string } | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getRecipes(query?: string, cuisine?: string, ingredient?: string): Promise<Recipe[]> {
    let conditions = [];

    if (query) {
      conditions.push(or(
        ilike(recipes.name, `%${query}%`),
        ilike(recipes.cuisine, `%${query}%`)
      ));
    }

    if (cuisine) {
      conditions.push(ilike(recipes.cuisine, `%${cuisine}%`));
    }
    
    // Note: Filtering by ingredient efficiently requires a join, for simplicity in MVP we might just search recipe names or do a subquery. 
    // To keep it simple and fast, we'll rely on name/cuisine search primarily, 
    // but if an ingredient is specified, we can find recipes that have it.
    if (ingredient) {
        // Find ingredient ID first
        const foundIngredients = await db.select().from(ingredients).where(ilike(ingredients.name, `%${ingredient}%`));
        if (foundIngredients.length > 0) {
            const ingredientIds = foundIngredients.map(i => i.id);
            const recipeIds = await db.select({ recipeId: recipeIngredients.recipeId })
                .from(recipeIngredients)
                .where(inArray(recipeIngredients.ingredientId, ingredientIds));
            
            if (recipeIds.length > 0) {
                const rIds = recipeIds.map(r => r.recipeId);
                conditions.push(inArray(recipes.id, rIds));
            } else {
                return []; // No recipes with this ingredient
            }
        } else {
            return []; // Ingredient not found
        }
    }

    return await db.select().from(recipes).where(and(...conditions));
  }

  async getRecipe(id: number): Promise<RecipeWithIngredients | undefined> {
    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, id),
      with: {
        ingredients: {
          with: {
            ingredient: true,
          },
        },
      },
    });
    return recipe;
  }

  async getMealPlans(): Promise<MealPlanWithRecipe[]> {
    return await db.query.mealPlans.findMany({
      with: {
        recipe: true,
      },
      orderBy: (mealPlans, { asc }) => [asc(mealPlans.day)],
    });
  }

  async createMealPlan(plan: InsertMealPlan): Promise<MealPlan> {
    const [created] = await db.insert(mealPlans).values(plan).returning();
    return created;
  }

  async deleteMealPlan(id: number): Promise<void> {
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }

  async clearMealPlans(): Promise<void> {
    await db.delete(mealPlans);
  }

  // Seed Helpers
  async createRecipe(recipe: { name: string; cuisine?: string }): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return created;
  }

  async createIngredient(name: string): Promise<{ id: number; name: string }> {
    // Check exist first to avoid unique constraint errors during race conditions or re-seeding
    const existing = await this.getIngredientByName(name);
    if (existing) return existing;
    
    const [created] = await db.insert(ingredients).values({ name }).onConflictDoNothing().returning();
    if (!created) return await this.getIngredientByName(name) as { id: number; name: string };
    return created;
  }

  async addRecipeIngredient(recipeId: number, ingredientId: number, quantity: string): Promise<void> {
    await db.insert(recipeIngredients).values({
      recipeId,
      ingredientId,
      quantity,
    });
  }

  async getRecipeByName(name: string): Promise<Recipe | undefined> {
      return await db.query.recipes.findFirst({
          where: eq(recipes.name, name)
      });
  }

  async getIngredientByName(name: string): Promise<{ id: number; name: string } | undefined> {
      return await db.query.ingredients.findFirst({
          where: eq(ingredients.name, name)
      });
  }
}

export const storage = new DatabaseStorage();
