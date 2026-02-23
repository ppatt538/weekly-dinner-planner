import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cuisine: text("cuisine"),
  imageUrl: text("image_url"),
  servings: integer("servings").default(4),
  prepTime: integer("prep_time").default(30),
  instructions: text("instructions").array(),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Join table for many-to-many relation with quantity
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id),
  quantity: text("quantity"), // Storing as text (e.g., "5 tsp") for simplicity initially
});

export const weeklyPlan = pgTable("weekly_plan", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(), // "Monday", "Tuesday", etc.
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
});

// === RELATIONS ===

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  plans: many(weeklyPlan),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipes: many(recipeIngredients),
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

export const weeklyPlanRelations = relations(weeklyPlan, ({ one }) => ({
  recipe: one(recipes, {
    fields: [weeklyPlan.recipeId],
    references: [recipes.id],
  }),
}));

// === EXPLICIT API CONTRACT TYPES ===

export type Recipe = typeof recipes.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type WeeklyPlanItem = typeof weeklyPlan.$inferSelect;

// Composite type for fetching
export type RecipeWithIngredients = Recipe & {
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
};

export type WeeklyPlanItemWithRecipe = WeeklyPlanItem & {
  recipe: RecipeWithIngredients;
};

// Request types
export const insertWeeklyPlanSchema = createInsertSchema(weeklyPlan).omit({ id: true });
export type CreateWeeklyPlanRequest = z.infer<typeof insertWeeklyPlanSchema>;

export type UpdatePlanRequest = Partial<CreateWeeklyPlanRequest>;

// Response types
export type ShoppingListItem = {
  ingredientId: number;
  name: string;
  quantity: string;
  recipes: string[]; // List of recipes using this item
};

export type ShoppingListResponse = ShoppingListItem[];

// AI Recipe Generation types
export type AIRecipeInput = {
  text?: string;
  imageBase64?: string;
};

export type AIRecipeOutput = {
  name: string;
  cuisine: string;
  servings: number;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
};

// Export chat models for AI integration
export * from "./models/chat";
