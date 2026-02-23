import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Instructions for each recipe (from EveryPlate)
const recipeInstructions: Record<string, string[]> = {
  "Crispy Chicken Parm": [
    "Preheat oven to 425°F",
    "Cut potatoes into wedges and toss with oil, salt, and pepper",
    "Roast potatoes for 25-30 minutes until crispy",
    "Set up breading station with flour, beaten egg, and panko",
    "Season chicken with salt and pepper",
    "Bread chicken in flour, egg, then panko",
    "Heat oil in pan and fry chicken until golden, about 3-4 min per side",
    "Top chicken with marinara and Monterey Jack",
    "Bake until cheese melts, about 5 minutes",
    "Toss green beans with oil and roast alongside potatoes",
    "Make garlic aioli by mixing mayo with minced garlic",
    "Serve chicken with potato wedges, green beans, and aioli"
  ],
  "Balsamic-Glazed Meatballs": [
    "Preheat oven to 425°F",
    "Soak white bread in milk to make panade",
    "Mix ground beef with bread mixture, Italian seasoning, salt, and pepper",
    "Form into meatballs",
    "Heat oil in pan and brown meatballs on all sides",
    "Transfer meatballs to oven and bake 10-12 minutes",
    "Toss green beans with oil, salt, and pepper and roast",
    "In same pan, add balsamic vinegar, beef stock, ketchup, and brown sugar",
    "Simmer until thickened into glaze",
    "Halve ciabatta and brush with garlic butter",
    "Toast bread until golden",
    "Toss meatballs in balsamic glaze",
    "Serve meatballs with green beans and garlic bread"
  ],
  "Garlic Rosemary Chicken": [
    "Preheat oven to 450°F",
    "Cut potatoes, sweet potato, carrots, and onion into chunks",
    "Toss vegetables with oil, salt, pepper, and half the rosemary",
    "Roast vegetables for 30-35 minutes until tender",
    "Season chicken with salt, pepper, and remaining rosemary",
    "Dredge chicken in flour",
    "Heat oil and butter in pan",
    "Cook chicken 5-6 minutes per side until golden and cooked through",
    "Remove chicken and add garlic to pan",
    "Add chicken stock and simmer to create pan sauce",
    "Pour sauce over chicken",
    "Serve chicken with roasted vegetables"
  ],
  "Sesame Pork Rice Bowls": [
    "Cook jasmine rice according to package directions",
    "Heat oil in large pan over medium-high heat",
    "Add ground pork and cook breaking up with spoon until browned",
    "Season with salt and pepper",
    "Trim and thinly slice scallions, separating whites and greens",
    "Add scallion whites to pork and cook 1 minute",
    "Add ponzu sauce and soy sauce to pork, stir to combine",
    "In small bowl, toss cabbage-carrot mix with sesame dressing",
    "In another bowl, mix mayonnaise with sweet Thai chili sauce and hot sauce for spicy mayo",
    "Divide rice between bowls",
    "Top with pork mixture and creamy slaw",
    "Drizzle with spicy mayo",
    "Garnish with scallion greens"
  ],
  "Kung Pao Beef Bowls": [
    "Cook white rice according to package directions",
    "Core, deseed, and dice bell pepper",
    "Peel and mince ginger and garlic",
    "Trim and thinly slice scallions",
    "Heat oil in large pan over medium-high heat",
    "Add ground beef and cook until browned, about 5-6 minutes",
    "Add bell pepper, ginger, and garlic",
    "Cook until pepper softens, 3-4 minutes",
    "Stir in sweet soy glaze",
    "Add butter and stir until melted",
    "Season with salt and pepper",
    "Divide rice between bowls",
    "Top with kung pao beef",
    "Sprinkle with peanuts and scallions"
  ],
  "Tex-Mex Steak over Zesty Rice": [
    "Cook rice with beef stock concentrate according to package directions",
    "Halve, peel, and dice onion",
    "Dice tomato",
    "Zest and quarter lime",
    "Pat steak dry with paper towels and season with salt, pepper, and Tex-Mex paste",
    "Heat oil in large pan over medium-high heat",
    "Add steak and cook until browned and cooked through, 4-5 minutes",
    "Transfer steak to plate",
    "Add onion to same pan and cook until softened, 3-4 minutes",
    "Make pico de gallo by mixing tomato, half the onion, lime juice, salt, and pepper",
    "Mix sour cream with smoky red pepper crema and lime zest",
    "Fluff rice with fork and stir in lime juice",
    "Divide rice between bowls",
    "Top with steak and cooked onion",
    "Drizzle with lime crema",
    "Serve with pico de gallo on side"
  ],
  "Sticky Soy Chicken Stir-Fry & Rice": [
    "Cook white rice according to package directions",
    "Trim and thinly slice scallions, separating whites and greens",
    "Heat oil in large pan over medium-high heat",
    "Add ground chicken and cook breaking up with spoon until browned, 5-6 minutes",
    "Season chicken with garlic powder, salt, and pepper",
    "Add scallion whites and coleslaw mix to pan",
    "Stir-fry until cabbage softens, 2-3 minutes",
    "Add sweet soy glaze, soy sauce, and honey",
    "Toss to coat and cook 1 minute more",
    "Divide rice between bowls",
    "Top with sticky soy chicken stir-fry",
    "Sprinkle with sesame seeds and scallion greens"
  ],
  "Creamy Tomato Beef Linguine": [
    "Bring large pot of salted water to boil",
    "Cook linguine until al dente, 9-11 minutes",
    "Reserve 1 cup pasta cooking water, then drain",
    "Heat oil in large pan over medium-high heat",
    "Add ground beef and cook breaking up with spoon until browned, 5-6 minutes",
    "Season with salt, pepper, garlic powder, and Italian seasoning",
    "Add tomato paste and cook 1 minute",
    "Stir in cream sauce base and beef stock concentrate",
    "Add splash of reserved pasta water to create sauce",
    "Bring to simmer and cook until thickened, 2-3 minutes",
    "Add butter and stir until melted",
    "Toss drained linguine with sauce",
    "Add more pasta water if needed to loosen",
    "Divide between plates",
    "Top with grated Parmesan cheese"
  ],
  "Swedish Meatloaves": [
    "Preheat oven to 450°F",
    "Peel and cut potatoes into 1-inch pieces",
    "Peel and dice carrots",
    "Halve, peel, and dice onion",
    "Tear white bread into small pieces and soak in milk",
    "Toss potatoes and carrots with oil, salt, and pepper on baking sheet",
    "Roast 25-30 minutes until tender and golden",
    "In bowl, mix ground beef, soaked bread, half the onion, nutmeg, salt, and pepper",
    "Form into 4 mini meatloaves",
    "Place on separate baking sheet and bake 20-25 minutes",
    "Heat butter in pan over medium heat",
    "Add remaining onion and cook until softened",
    "Sprinkle with flour and stir 1 minute",
    "Slowly whisk in beef stock and milk",
    "Simmer until thickened into gravy, 3-4 minutes",
    "Divide meatloaves, potatoes, and carrots between plates",
    "Drizzle with gravy"
  ],
  "Fresh One-Pan Pork Carnitas Tacos": [
    "Halve, peel, and thinly slice red onion",
    "In small bowl, combine onion with white wine vinegar, sugar, and salt for pickled onions",
    "Let sit at least 10 minutes",
    "Core, deseed, and dice poblano pepper",
    "Dice tomatoes",
    "Chop cilantro",
    "Zest and quarter lime",
    "Heat oil in large pan over medium-high heat",
    "Add ground pork and cook breaking up with spoon until browned",
    "Add poblano and cook until softened, 3-4 minutes",
    "Stir in tomato paste and fajita spice",
    "Add chicken stock concentrate and 1/4 cup water",
    "Simmer until thickened, 2-3 minutes",
    "Warm tortillas in dry pan or microwave",
    "Make pico de gallo with tomatoes, cilantro, lime juice, salt, and pepper",
    "Fill tortillas with pork carnitas",
    "Top with pickled onions and pico de gallo"
  ],
  "Tex-Mex Turkey Tacos": [
    "Halve, peel, and thinly slice red onion",
    "In small bowl, toss onion with sugar and lime juice for pickled onions",
    "Let sit at least 10 minutes",
    "Mince garlic",
    "Heat oil in large pan over medium-high heat",
    "Add ground turkey and cook breaking up with spoon until browned, 5-6 minutes",
    "Add garlic and Tex-Mex paste",
    "Season with salt and pepper and cook 1 minute more",
    "Warm tortillas in dry pan or microwave",
    "Fill tortillas with turkey mixture",
    "Top with sour cream and pickled onions",
    "Sprinkle with crispy fried onions"
  ],
  "Beef Banh Mi Bowls": [
    "Cook jasmine rice according to package directions",
    "Trim and thinly slice cucumber on angle",
    "In bowl, toss cucumber with sugar and lime juice for quick pickle",
    "Peel carrot and cut into thin matchsticks",
    "Halve, peel, and thinly slice onion",
    "Mince garlic",
    "Heat oil in large pan over medium-high heat",
    "Add ground beef and cook until browned, 5-6 minutes",
    "Add onion and garlic and cook until softened, 3-4 minutes",
    "Stir in ponzu sauce",
    "Season with salt and pepper",
    "In small bowl, mix mayonnaise with sriracha for spicy mayo",
    "Divide rice between bowls",
    "Top with beef mixture",
    "Add pickled cucumber and fresh carrots",
    "Drizzle with sriracha mayo",
    "Garnish with lime wedges"
  ],
  "Banh Mi-Style Beef Tacos": [
    "Cook jasmine rice according to package directions",
    "Trim and thinly slice cucumber on angle",
    "In bowl, toss cucumber with sugar and lime juice for quick pickle",
    "Peel carrot and cut into thin matchsticks",
    "Mince garlic",
    "Heat oil in large pan over medium-high heat",
    "Add ground beef and cook until browned, 5-6 minutes",
    "Add garlic and cook 1 minute",
    "Stir in sweet soy glaze and sweet Thai chili sauce",
    "Season with salt and pepper",
    "Warm tortillas in dry pan or microwave",
    "Fill tortillas with beef mixture",
    "Top with pickled cucumber, carrots, and sriracha",
    "Drizzle with lime juice"
  ],
  "Coconut Curry Pork Noodle Bowls": [
    "Bring pot of water to boil for noodles",
    "Trim bok choy and slice into strips",
    "Mince garlic",
    "Trim and thinly slice scallions",
    "Heat oil in large pan over medium-high heat",
    "Add ground pork and cook breaking up until browned, 5-6 minutes",
    "Season with curry powder, garlic powder, salt, and pepper",
    "Add coconut milk, chicken stock, and mushroom stock",
    "Bring to simmer",
    "Cook ramen noodles according to package",
    "Add bok choy to curry and cook until wilted, 2-3 minutes",
    "Divide noodles between bowls",
    "Top with curry pork and vegetables",
    "Garnish with scallions"
  ],
  "Crispy Chicken Strips": [
    "Preheat oven to 425°F",
    "Cut potatoes into wedges",
    "Toss potatoes with oil, fry seasoning, salt, and pepper",
    "Roast potatoes for 25-30 minutes until crispy",
    "Cut chicken into strips",
    "Season with garlic powder, salt, and pepper",
    "Dredge in flour and shake off excess",
    "Heat oil in pan over medium-high heat",
    "Fry chicken strips until golden and cooked through, 3-4 minutes per side",
    "Slice zucchini and toss with oil, salt, and pepper",
    "Roast zucchini alongside potatoes",
    "Serve chicken strips with potato wedges and zucchini",
    "Serve BBQ sauce and honey dijon on the side for dipping"
  ],
  "Greek Pork Meatball Bowls": [
    "Bring pot of water to boil for couscous",
    "Cook Israeli couscous according to package with chicken stock",
    "Dice cucumber and tomato",
    "Mince garlic",
    "In bowl, mix ground pork, panko, garlic, dried oregano, salt, and pepper",
    "Form into meatballs",
    "Heat oil in pan over medium-high heat",
    "Cook meatballs until browned and cooked through, about 8-10 minutes",
    "Toss cucumber and tomato with Greek vinaigrette",
    "Mix sour cream with a little water to thin",
    "Divide couscous between bowls",
    "Top with meatballs",
    "Add cucumber tomato salad",
    "Drizzle with sour cream sauce"
  ],
  "Italian Pork Sausage Pasta": [
    "Bring large pot of salted water to boil",
    "Cook linguine until al dente, 9-11 minutes",
    "Reserve 1 cup pasta cooking water, then drain",
    "Remove sausage from casing",
    "Mince garlic",
    "Heat oil in large pan over medium-high heat",
    "Add sausage and cook breaking up until browned, 5-6 minutes",
    "Add garlic and Italian seasoning and cook 1 minute",
    "Dice tomato and add to pan",
    "Stir in cream sauce base and cream cheese",
    "Add chicken stock and splash of pasta water",
    "Simmer until thickened, 2-3 minutes",
    "Toss linguine with sauce",
    "Halve ciabatta and toast",
    "Serve pasta with toasted bread"
  ],
  "Jammin' Fig Pork Chops": [
    "Preheat oven to 425°F",
    "Cut potatoes into wedges",
    "Toss potatoes with oil, salt, and pepper",
    "Roast potatoes for 25-30 minutes until crispy",
    "Trim green beans",
    "Mince garlic",
    "Pat pork chops dry and season with salt and pepper",
    "Heat oil in pan over medium-high heat",
    "Cook pork chops 4-5 minutes per side until cooked through",
    "Transfer to plate and rest",
    "Add garlic to pan and cook 30 seconds",
    "Add fig jam, chicken stock, and butter",
    "Simmer until thickened into glaze",
    "Toss green beans with oil and roast alongside potatoes",
    "Serve pork chops with fig glaze, potatoes, and green beans"
  ],
  "Ponzu Chili Beef Bowls": [
    "Cook jasmine rice according to package directions",
    "Trim sugar snap peas",
    "Mince garlic and ginger",
    "Heat oil in large pan over medium-high heat",
    "Add ground beef and cook until browned, 5-6 minutes",
    "Add garlic and ginger and cook 1 minute",
    "Add sugar snap peas and cook 2-3 minutes until crisp-tender",
    "Stir in ponzu sauce and sweet Thai chili sauce",
    "Season with salt and pepper",
    "Divide rice between bowls",
    "Top with beef and snap pea mixture",
    "Drizzle with extra ponzu if desired"
  ],
  "Southwest Pork Flautas": [
    "Halve, peel, and dice onion",
    "Mince garlic",
    "Quarter lime",
    "Dice tomato",
    "Heat oil in large pan over medium-high heat",
    "Add ground pork and cook breaking up until browned, 5-6 minutes",
    "Add onion and garlic, cook until softened, 3-4 minutes",
    "Season with southwest spice blend, salt, and pepper",
    "Add chicken stock and simmer until thickened",
    "Warm tortillas in dry pan",
    "Fill tortillas with pork mixture and shredded cheese",
    "Roll tightly into flautas",
    "Heat oil in pan and fry flautas until golden and crispy",
    "Mix sour cream with lime juice",
    "Serve flautas with lime crema and diced tomato"
  ]
};

// Determine cuisine from recipe name
function getCuisineFromName(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Asian cuisines
  if (lowerName.includes("banh mi") || lowerName.includes("kung pao") || 
      lowerName.includes("ponzu") || lowerName.includes("sesame") ||
      lowerName.includes("soy") || lowerName.includes("stir-fry") ||
      lowerName.includes("thai") || lowerName.includes("teriyaki") ||
      lowerName.includes("wok") || lowerName.includes("noodle") ||
      lowerName.includes("dim sum") || lowerName.includes("dumpling")) {
    return "Asian";
  }
  
  // Indian
  if (lowerName.includes("curry") || lowerName.includes("tikka") ||
      lowerName.includes("masala") || lowerName.includes("tandoori") ||
      lowerName.includes("naan") || lowerName.includes("biryani")) {
    return "Indian";
  }
  
  // Mexican
  if (lowerName.includes("taco") || lowerName.includes("carnitas") || 
      lowerName.includes("flauta") || lowerName.includes("fajita") ||
      lowerName.includes("burrito") || lowerName.includes("enchilada") ||
      lowerName.includes("quesadilla") || lowerName.includes("salsa")) {
    return "Mexican";
  }
  
  // Southwestern
  if (lowerName.includes("tex-mex") || lowerName.includes("southwest") ||
      lowerName.includes("chipotle") || lowerName.includes("verde")) {
    return "Southwestern";
  }
  
  // Italian
  if (lowerName.includes("italian") || lowerName.includes("parm") || 
      lowerName.includes("pasta") || lowerName.includes("linguine") ||
      lowerName.includes("marinara") || lowerName.includes("risotto") ||
      lowerName.includes("lasagna") || lowerName.includes("bruschetta")) {
    return "Italian";
  }
  
  // French
  if (lowerName.includes("french") || lowerName.includes("croissant") ||
      lowerName.includes("béarnaise") || lowerName.includes("provençal") ||
      lowerName.includes("coq au vin") || lowerName.includes("beurre")) {
    return "French";
  }
  
  // Greek
  if (lowerName.includes("greek") || lowerName.includes("gyro") ||
      lowerName.includes("tzatziki") || lowerName.includes("feta") ||
      lowerName.includes("souvlaki")) {
    return "Greek";
  }
  
  // Mediterranean
  if (lowerName.includes("mediterranean") || lowerName.includes("hummus") ||
      lowerName.includes("falafel") || lowerName.includes("olive") ||
      lowerName.includes("balsamic")) {
    return "Mediterranean";
  }
  
  // Middle Eastern
  if (lowerName.includes("shawarma") || lowerName.includes("kebab") ||
      lowerName.includes("tahini") || lowerName.includes("pita") ||
      lowerName.includes("harissa")) {
    return "Middle Eastern";
  }
  
  // Caribbean
  if (lowerName.includes("jerk") || lowerName.includes("caribbean") ||
      lowerName.includes("jamaican") || lowerName.includes("plantain") ||
      lowerName.includes("mango") && lowerName.includes("habanero")) {
    return "Caribbean";
  }
  
  // Southern
  if (lowerName.includes("southern") || lowerName.includes("cajun") ||
      lowerName.includes("fried chicken") || lowerName.includes("cornbread") ||
      lowerName.includes("gumbo") || lowerName.includes("creole")) {
    return "Southern";
  }
  
  // American (default for comfort food)
  if (lowerName.includes("bbq") || lowerName.includes("strips") ||
      lowerName.includes("meatloaf") || lowerName.includes("rosemary") ||
      lowerName.includes("fig") || lowerName.includes("honey") ||
      lowerName.includes("burger") || lowerName.includes("steak")) {
    return "American";
  }
  
  return "American";
}

// CSV Parsing and Seeding Logic
async function seedDatabase() {
  const existingRecipes = await storage.getRecipes();
  if (existingRecipes.length > 0) {
    // Update existing recipes with proper cuisines and instructions
    for (const recipe of existingRecipes) {
      if (recipe.cuisine === "General") {
        const newCuisine = getCuisineFromName(recipe.name);
        await storage.updateRecipeCuisine(recipe.id, newCuisine);
      }
      // Add instructions if missing
      if (!recipe.instructions || recipe.instructions.length === 0) {
        const instructions = recipeInstructions[recipe.name];
        if (instructions) {
          await storage.updateRecipeInstructions(recipe.id, instructions);
        }
      }
    }
    console.log("Database already seeded. Updated cuisines and instructions.");
    return;
  }

  const csvPath = path.join(process.cwd(), "attached_assets", "EveryPlate_Complete_Recipe_Ingredients_1768771411180.csv");
  
  if (!fs.existsSync(csvPath)) {
    console.error("CSV file not found:", csvPath);
    return;
  }

  console.log("Seeding database from CSV...");
  
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  
  parse(fileContent, {
    trim: true,
    skip_empty_lines: true
  }, async (err, records: string[][]) => {
    if (err) {
      console.error("Error parsing CSV:", err);
      return;
    }

    // Row 0: Headers (Recipe Names starting from index 1)
    const headers = records[0];
    const recipeNames = headers.slice(1);
    const recipeIds: number[] = [];

    // Create Recipes with proper cuisine
    for (const name of recipeNames) {
      if (!name) {
        recipeIds.push(-1); // Skip empty headers
        continue;
      }
      const cuisine = getCuisineFromName(name);
      const recipe = await storage.createRecipe(name, cuisine);
      recipeIds.push(recipe.id);
    }

    // Process Ingredients (Rows 1 to N)
    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      const ingredientName = row[0];
      
      if (!ingredientName) continue;

      const ingredient = await storage.createIngredient(ingredientName);

      // Link to recipes
      for (let j = 1; j < row.length; j++) {
        const quantity = row[j];
        const recipeId = recipeIds[j - 1];

        // Skip if invalid recipe or empty/dash quantity
        if (recipeId === -1 || !quantity || quantity === "—" || quantity === "") continue;

        await storage.linkIngredientToRecipe(recipeId, ingredient.id, quantity);
      }
    }
    console.log("Database seeding complete!");
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed on startup
  seedDatabase();

  app.get(api.recipes.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const recipes = await storage.getRecipes(search);
    res.json(recipes);
  });

  app.get(api.recipes.get.path, async (req, res) => {
    const recipe = await storage.getRecipe(Number(req.params.id));
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  });

  app.patch(api.recipes.updateImage.path, async (req, res) => {
    try {
      const { imageUrl } = api.recipes.updateImage.input.parse(req.body);
      const recipe = await storage.updateRecipeImage(Number(req.params.id), imageUrl);
      if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found' });
      }
      res.json(recipe);
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

  app.patch(api.recipes.updateServings.path, async (req, res) => {
    try {
      const { servings } = api.recipes.updateServings.input.parse(req.body);
      const recipe = await storage.updateRecipeServings(Number(req.params.id), servings);
      if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found' });
      }
      res.json(recipe);
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

  app.patch(api.recipes.toggleFavorite.path, async (req, res) => {
    try {
      const recipe = await storage.toggleFavorite(Number(req.params.id));
      if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found' });
      }
      res.json(recipe);
    } catch (err) {
      throw err;
    }
  });

  app.post(api.recipes.create.path, async (req, res) => {
    try {
      const input = api.recipes.create.input.parse(req.body);
      const recipe = await storage.createFullRecipe(input);
      res.status(201).json(recipe);
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

  app.put(api.recipes.update.path, async (req, res) => {
    try {
      const input = api.recipes.update.input.parse(req.body);
      const recipe = await storage.updateFullRecipe(Number(req.params.id), input);
      if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found' });
      }
      res.json(recipe);
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

  app.delete(api.recipes.delete.path, async (req, res) => {
    const deleted = await storage.deleteRecipe(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.status(204).send();
  });

  app.post("/api/recipes/generate-ai", async (req, res) => {
    try {
      const { text, imageBase64 } = req.body;

      if (!text && !imageBase64) {
        return res.status(400).json({ message: "Please provide text description or an image" });
      }

      const systemPrompt = `You are a helpful cooking assistant that extracts recipe details from user input.
Given a recipe description or image, extract and return a JSON object with the following structure:
{
  "name": "Recipe Name",
  "cuisine": "One of: American, Italian, Asian, Mexican, Mediterranean, European",
  "servings": 4,
  "ingredients": [
    { "name": "ingredient name", "quantity": "amount with unit (e.g., 2 cups, 1 lb, 3 tbsp)" }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ]
}

Rules:
- Extract all ingredients with their quantities
- Break down cooking instructions into clear, numbered steps
- Choose the most appropriate cuisine category
- Default to 4 servings if not specified
- Be thorough but concise in instructions
- Return ONLY valid JSON, no additional text`;

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt }
      ];

      if (imageBase64) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: text || "Please analyze this recipe image and extract all the recipe details." },
            { 
              type: "image_url", 
              image_url: { 
                url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` 
              } 
            }
          ]
        });
      } else {
        messages.push({
          role: "user",
          content: `Extract recipe details from this description:\n\n${text}`
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ message: "AI did not return a response" });
      }

      const recipeData = JSON.parse(content);
      res.json(recipeData);
    } catch (error) {
      console.error("AI recipe generation error:", error);
      res.status(500).json({ message: "Failed to generate recipe from AI" });
    }
  });

  app.get(api.plan.list.path, async (req, res) => {
    const plan = await storage.getWeeklyPlan();
    res.json(plan);
  });

  app.post(api.plan.add.path, async (req, res) => {
    try {
      const input = api.plan.add.input.parse(req.body);
      const item = await storage.addToPlan(input);
      res.status(201).json(item);
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

  app.delete(api.plan.remove.path, async (req, res) => {
    await storage.removeFromPlan(Number(req.params.id));
    res.status(204).send();
  });

  app.delete(api.plan.clear.path, async (req, res) => {
    await storage.clearPlan();
    res.status(204).send();
  });

  app.get(api.shoppingList.get.path, async (req, res) => {
    const list = await storage.getShoppingList();
    res.json(list);
  });

  // Get all unique ingredients organized by category
  app.get("/api/ingredients", async (req, res) => {
    const recipes = await storage.getRecipes();
    
    // Normalize ingredient name for deduplication
    function normalizeKey(name: string): string {
      let normalized = name.toLowerCase().trim();
      
      // Handle 'ies' -> 'y' first (e.g., 'berries' -> 'berry')
      if (normalized.endsWith('ies') && normalized.length > 4) {
        return normalized.slice(0, -3) + 'y';
      }
      
      // Handle 'oes' -> 'o' (e.g., 'tomatoes' -> 'tomato', 'potatoes' -> 'potato')
      if (normalized.endsWith('oes') && normalized.length > 4) {
        return normalized.slice(0, -2);
      }
      
      // Handle 'es' -> '' for words ending in 'shes', 'ches', 'xes', 'zes', 'ses' (e.g., 'dishes' -> 'dish', 'lettuces' -> 'lettuce')
      if ((normalized.endsWith('shes') || normalized.endsWith('ches') || 
           normalized.endsWith('xes') || normalized.endsWith('zes') || 
           normalized.endsWith('ses') || normalized.endsWith('ces')) && normalized.length > 4) {
        return normalized.slice(0, -1); // Remove just the 's' to keep the 'e'
      }
      
      // Don't remove 's' from words ending in: ss, us (e.g., hummus, couscous, asparagus)
      if (normalized.endsWith('ss') || normalized.endsWith('us')) {
        return normalized;
      }
      
      // Remove trailing 's' for basic plurals
      if (normalized.endsWith('s') && normalized.length > 3) {
        normalized = normalized.slice(0, -1);
      }
      
      return normalized;
    }
    
    // Convert to title case for display
    function toTitleCase(name: string): string {
      return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // Collect all unique ingredients with normalization
    const ingredientMap = new Map<string, { id: number; name: string }>();
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const key = normalizeKey(ing.ingredient.name);
        const existing = ingredientMap.get(key);
        if (!existing) {
          ingredientMap.set(key, {
            id: ing.ingredient.id,
            name: toTitleCase(ing.ingredient.name)
          });
        } else {
          // Use the lowest ID for consistency
          if (ing.ingredient.id < existing.id) {
            existing.id = ing.ingredient.id;
          }
        }
      });
    });

    // Pantry/sauce items that should go to "Other" category regardless of other keywords
    const PANTRY_KEYWORDS = ["powder", "stock concentrate", "sauce", "seasoning", "spice", "dried", "oil", "vinegar", "paste", "extract", "soup", "broth", "condensed", "ground pepper", "black pepper", "white pepper", "flakes", "seeds"];
    
    // Categorization keywords
    const PROTEIN_KEYWORDS = ["ground beef", "ground chicken", "ground pork", "ground turkey", "beef", "chicken", "pork", "turkey", "steak", "sausage", "meatball", "meatloaf", "cutlet", "bacon", "egg", "shrimp", "fish", "salmon", "tilapia"];
    const GRAINS_KEYWORDS = ["rice", "pasta", "linguine", "noodle", "bread", "ciabatta", "tortilla", "couscous", "panko", "breadcrumb", "flour", "ramen"];
    const PRODUCE_KEYWORDS = ["onion", "garlic", "tomato", "pepper", "carrot", "potato", "bean", "cucumber", "lime", "scallion", "cabbage", "zucchini", "rosemary", "cilantro", "ginger", "bok choy", "peas", "mushroom", "parsley", "lemon", "lettuce", "spinach", "kale", "celery", "corn", "broccoli", "asparagus", "snap peas"];
    const DAIRY_KEYWORDS = ["cheese", "milk", "cream", "butter", "sour cream", "yogurt", "monterey", "parmesan", "mozzarella"];
    
    // Items that are typically always available in a kitchen (pantry staples)
    const ALWAYS_AVAILABLE_EXACT = ["butter", "milk", "soy sauce", "olive oil", "vegetable oil", "salt", "pepper", "garlic powder", "onion powder", "honey", "vinegar", "mayonnaise", "ketchup", "mustard", "hot sauce", "sriracha", "sesame seeds", "italian seasoning", "paprika", "cumin", "oregano", "basil", "thyme", "beef stock concentrate", "chicken stock concentrate", "vegetable stock concentrate"];

    function categorizeIngredient(name: string): string {
      const lowerName = name.toLowerCase();
      
      // Check for pantry items first - these override other categories
      if (PANTRY_KEYWORDS.some(k => lowerName.includes(k))) return "Other";
      
      if (PROTEIN_KEYWORDS.some(k => lowerName.includes(k))) return "Protein";
      if (GRAINS_KEYWORDS.some(k => lowerName.includes(k))) return "Grains";
      if (PRODUCE_KEYWORDS.some(k => lowerName.includes(k))) return "Produce";
      if (DAIRY_KEYWORDS.some(k => lowerName.includes(k))) return "Dairy";
      return "Other";
    }

    function isAlwaysAvailable(name: string): boolean {
      const lowerName = name.toLowerCase();
      // Use exact matching to avoid false positives like "sugar" matching "Sugar Snap Peas"
      return ALWAYS_AVAILABLE_EXACT.some(k => lowerName === k.toLowerCase());
    }

    // Organize by category
    const categorized: Record<string, { id: number; name: string; alwaysAvailable: boolean }[]> = {
      Protein: [],
      Grains: [],
      Produce: [],
      Dairy: [],
      Other: []
    };

    ingredientMap.forEach(ing => {
      const category = categorizeIngredient(ing.name);
      categorized[category].push({
        ...ing,
        alwaysAvailable: isAlwaysAvailable(ing.name)
      });
    });

    // Sort each category alphabetically
    Object.keys(categorized).forEach(cat => {
      categorized[cat].sort((a, b) => a.name.localeCompare(b.name));
    });

    res.json(categorized);
  });

  // AI-powered ingredient matching from fridge description
  app.post("/api/ingredients/match", async (req, res) => {
    try {
      const { description, allIngredients } = req.body;

      if (!description || !allIngredients) {
        return res.status(400).json({ message: "Description and ingredients list required" });
      }

      const ingredientNames = allIngredients.map((i: { name: string }) => i.name).join(", ");

      const systemPrompt = `You are a helpful kitchen assistant that matches available ingredients to a recipe database.

Given a user's description of what they have in their fridge/pantry, identify which ingredients from the database they likely have available.

Database ingredients: ${ingredientNames}

Rules:
- Match user's items to the exact ingredient names in the database
- Be generous with matching - if they say "chicken" match any chicken-related ingredients (Ground Chicken, Chicken Cutlets, Chicken breast strips, etc.)
- If they say "rice" match Jasmine Rice, White Rice, etc.
- If they say "beef" match Ground Beef, Ground beef (80% Lean), Diced Steak, Beef Stock Concentrate, etc.
- If they say "pork" match Ground Pork, Pork Chops, Italian Pork Sausage, etc.
- If they say "peppers" or "pepper" match Bell Pepper, Chili pepper, Poblano Pepper, etc.
- Consider common substitutes and related items
- Only include ingredients that exist in the database ingredient list above
- Be generous - match anything that reasonably relates to what the user mentioned

Return a JSON object with a "matchedIngredients" array containing the exact ingredient names from the database.

Example: If user says "I have chicken and rice", return:
{"matchedIngredients": ["Ground Chicken", "Chicken Cutlets", "Chicken breast strips", "Jasmine Rice", "White Rice"]}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Match these ingredients from my fridge/pantry to the database: "${description}"` }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      console.log("AI ingredient matching response:", content);
      
      if (!content) {
        return res.status(500).json({ message: "AI did not return a response" });
      }

      const parsed = JSON.parse(content);
      // Handle various response formats the AI might use
      let matchedIngredients: string[] = [];
      if (Array.isArray(parsed)) {
        matchedIngredients = parsed;
      } else if (parsed.matchedIngredients && Array.isArray(parsed.matchedIngredients)) {
        matchedIngredients = parsed.matchedIngredients;
      } else if (parsed.ingredients && Array.isArray(parsed.ingredients)) {
        matchedIngredients = parsed.ingredients;
      } else if (parsed.matched && Array.isArray(parsed.matched)) {
        matchedIngredients = parsed.matched;
      } else {
        // Try to find any array property in the response
        for (const key of Object.keys(parsed)) {
          if (Array.isArray(parsed[key])) {
            matchedIngredients = parsed[key];
            break;
          }
        }
      }
      
      console.log("Matched ingredients:", matchedIngredients);
      res.json({ matchedIngredients });
    } catch (error) {
      console.error("AI ingredient matching error:", error);
      res.status(500).json({ message: "Failed to match ingredients" });
    }
  });

  return httpServer;
}
