
import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cuisine: text("cuisine"), // Inferred from name or manually set
  description: text("description"),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id),
  quantity: text("quantity").notNull(), // Storing as text to handle units like "5 tsp", "2 Cloves"
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(), // "Monday", "Tuesday", etc.
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
});

// === RELATIONS ===

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  mealPlans: many(mealPlans),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  inRecipes: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  recipe: one(recipes, {
    fields: [mealPlans.recipeId],
    references: [recipes.id],
  }),
}));

// === SCHEMAS ===

export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true });
export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({ id: true });

// === TYPES ===

export type Recipe = typeof recipes.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;

// Custom types for responses
export type RecipeWithIngredients = Recipe & {
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
};

export type MealPlanWithRecipe = MealPlan & {
  recipe: Recipe;
};
