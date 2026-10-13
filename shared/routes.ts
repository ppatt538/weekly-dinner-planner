
import { z } from 'zod';
import { insertMealPlanSchema, recipes, mealPlans, ingredients } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  recipes: {
    list: {
      method: 'GET' as const,
      path: '/api/recipes',
      input: z.object({
        q: z.string().optional(), // Search query
        cuisine: z.string().optional(), // Filter by cuisine
        ingredient: z.string().optional(), // Filter by ingredient
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof recipes.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/recipes/:id',
      responses: {
        200: z.custom<any>(), // Returns RecipeWithIngredients
        404: errorSchemas.notFound,
      },
    },
  },
  mealPlans: {
    list: {
      method: 'GET' as const,
      path: '/api/meal-plans',
      responses: {
        200: z.array(z.custom<any>()), // Returns MealPlanWithRecipe[]
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/meal-plans',
      input: insertMealPlanSchema,
      responses: {
        201: z.custom<typeof mealPlans.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/meal-plans/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    clear: {
        method: 'DELETE' as const,
        path: '/api/meal-plans', // Clear all
        responses: {
            204: z.void(),
        }
    }
  },
  shoppingList: {
    get: {
      method: 'GET' as const,
      path: '/api/shopping-list',
      responses: {
        200: z.array(z.object({
          ingredient: z.string(),
          quantity: z.string(), // Aggregated or listed quantities
          recipeCount: z.number(),
        })),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
