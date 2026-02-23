import { z } from 'zod';
import { insertWeeklyPlanSchema, recipes, weeklyPlan } from './schema';

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
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.any()), // typing as any for now to avoid complex nested zod definition issues, usually would be z.custom<RecipeWithIngredients>()
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/recipes/:id',
      responses: {
        200: z.any(), // RecipeWithIngredients
        404: errorSchemas.notFound,
      },
    },
    updateImage: {
      method: 'PATCH' as const,
      path: '/api/recipes/:id/image',
      input: z.object({
        imageUrl: z.string(),
      }),
      responses: {
        200: z.any(), // Recipe
        404: errorSchemas.notFound,
      },
    },
    updateServings: {
      method: 'PATCH' as const,
      path: '/api/recipes/:id/servings',
      input: z.object({
        servings: z.number().min(1).max(20),
      }),
      responses: {
        200: z.any(), // Recipe
        404: errorSchemas.notFound,
      },
    },
    toggleFavorite: {
      method: 'PATCH' as const,
      path: '/api/recipes/:id/favorite',
      responses: {
        200: z.any(), // Recipe
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/recipes',
      input: z.object({
        name: z.string().min(1, "Recipe name is required"),
        cuisine: z.string().optional(),
        instructions: z.array(z.string()).optional(),
        ingredients: z.array(z.object({
          name: z.string().min(1),
          quantity: z.string().optional(),
        })).optional(),
      }),
      responses: {
        201: z.any(), // RecipeWithIngredients
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/recipes/:id',
      input: z.object({
        name: z.string().min(1, "Recipe name is required"),
        cuisine: z.string().optional(),
        prepTime: z.number().min(1).max(180).optional(),
        instructions: z.array(z.string()).optional(),
        ingredients: z.array(z.object({
          name: z.string().min(1),
          quantity: z.string().optional(),
        })).optional(),
      }),
      responses: {
        200: z.any(), // RecipeWithIngredients
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/recipes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  plan: {
    list: {
      method: 'GET' as const,
      path: '/api/plan',
      responses: {
        200: z.array(z.any()), // WeeklyPlanItemWithRecipe
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/plan',
      input: insertWeeklyPlanSchema,
      responses: {
        201: z.custom<typeof weeklyPlan.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/plan/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    clear: {
      method: 'DELETE' as const,
      path: '/api/plan',
      responses: {
        204: z.void(),
      },
    },
  },
  shoppingList: {
    get: {
      method: 'GET' as const,
      path: '/api/shopping-list',
      responses: {
        200: z.array(z.object({
          ingredientId: z.number(),
          name: z.string(),
          quantity: z.string(),
          recipes: z.array(z.string())
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
