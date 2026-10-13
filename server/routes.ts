
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === API ROUTES ===

  app.get(api.recipes.list.path, async (req, res) => {
    const { q, cuisine, ingredient } = req.query as { q?: string; cuisine?: string; ingredient?: string };
    const recipes = await storage.getRecipes(q, cuisine, ingredient);
    res.json(recipes);
  });

  app.get(api.recipes.get.path, async (req, res) => {
    const recipe = await storage.getRecipe(Number(req.params.id));
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json(recipe);
  });

  app.get(api.mealPlans.list.path, async (req, res) => {
    const plans = await storage.getMealPlans();
    res.json(plans);
  });

  app.post(api.mealPlans.create.path, async (req, res) => {
    try {
      const input = api.mealPlans.create.input.parse(req.body);
      const plan = await storage.createMealPlan(input);
      res.status(201).json(plan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.mealPlans.delete.path, async (req, res) => {
    await storage.deleteMealPlan(Number(req.params.id));
    res.status(204).end();
  });

  app.delete(api.mealPlans.clear.path, async (req, res) => {
      await storage.clearMealPlans();
      res.status(204).end();
  });

  app.get(api.shoppingList.get.path, async (req, res) => {
    const plans = await storage.getMealPlans();
    const ingredientMap = new Map<string, { quantity: string[], count: number }>();

    for (const plan of plans) {
      const recipe = await storage.getRecipe(plan.recipeId);
      if (recipe) {
        for (const ri of recipe.ingredients) {
          const existing = ingredientMap.get(ri.ingredient.name);
          if (existing) {
             if (ri.quantity && ri.quantity !== '—' && ri.quantity.trim() !== '') {
                 existing.quantity.push(ri.quantity);
             }
             existing.count++;
          } else {
             const quantities = (ri.quantity && ri.quantity !== '—' && ri.quantity.trim() !== '') ? [ri.quantity] : [];
             ingredientMap.set(ri.ingredient.name, { quantity: quantities, count: 1 });
          }
        }
      }
    }

    const shoppingList = Array.from(ingredientMap.entries()).map(([name, data]) => ({
      ingredient: name,
      quantity: data.quantity.join(' + '), // Simple aggregation for MVP
      recipeCount: data.count,
    })).sort((a, b) => a.ingredient.localeCompare(b.ingredient));

    res.json(shoppingList);
  });

  // === SEEDING ===
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existingRecipes = await storage.getRecipes();
  if (existingRecipes.length > 0) {
    console.log("Database already seeded");
    return;
  }

  console.log("Seeding database from CSV...");
  const csvPath = path.join(process.cwd(), "attached_assets", "EveryPlate_Complete_Recipe_Ingredients_1768771411180.csv");
  
  if (!fs.existsSync(csvPath)) {
      console.error("CSV file not found:", csvPath);
      return;
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  parse(fileContent, {
    columns: false, // We'll handle columns manually because the first row is headers
    trim: true,
    skip_empty_lines: true
  }, async (err, records: string[][]) => {
    if (err) {
      console.error("Error parsing CSV:", err);
      return;
    }

    if (!records || records.length < 2) return;

    const headers = records[0]; // Ingredient, Recipe1, Recipe2...
    const recipeNames = headers.slice(1); // Skip "Ingredient" column
    
    // Create Recipes
    const recipeMap = new Map<number, number>(); // Column Index -> DB ID
    
    for (let i = 0; i < recipeNames.length; i++) {
        const name = recipeNames[i];
        if (!name) continue;

        // Infer cuisine
        let cuisine = "International";
        const lowerName = name.toLowerCase();
        if (lowerName.includes("tacos") || lowerName.includes("mex") || lowerName.includes("fajita")) cuisine = "Mexican";
        else if (lowerName.includes("curry") || lowerName.includes("thai") || lowerName.includes("asian")) cuisine = "Asian";
        else if (lowerName.includes("pasta") || lowerName.includes("italian") || lowerName.includes("linguine")) cuisine = "Italian";
        else if (lowerName.includes("burger") || lowerName.includes("steak") || lowerName.includes("fry")) cuisine = "American";
        else if (lowerName.includes("banh mi") || lowerName.includes("vietnamese")) cuisine = "Vietnamese";
        else if (lowerName.includes("greek")) cuisine = "Greek";
        
        const recipe = await storage.createRecipe({ name, cuisine });
        recipeMap.set(i + 1, recipe.id); // +1 because we sliced headers
    }

    // Process Rows (Ingredients)
    for (let i = 1; i < records.length; i++) {
        const row = records[i];
        const ingredientName = row[0];
        if (!ingredientName) continue;

        const ingredient = await storage.createIngredient(ingredientName);

        // For each recipe column
        for (let j = 1; j < row.length; j++) {
            const quantity = row[j];
            const recipeId = recipeMap.get(j);
            
            if (recipeId && quantity && quantity !== '—' && quantity.trim() !== '') {
                await storage.addRecipeIngredient(recipeId, ingredient.id, quantity);
            }
        }
    }
    console.log("Seeding complete!");
  });
}
