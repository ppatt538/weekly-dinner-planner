# Weekly Dinner Planner

A comprehensive meal planning application with recipe management, weekly planning, and AI-powered recipe creation.

## Features

### Recipe Management
- Full CRUD operations: create, read, update, delete recipes
- 20+ pre-loaded EveryPlate recipes with detailed instructions
- Search and filter by cuisine type or ingredient
- Favorites functionality for quick access
- Recipe images with URL management
- Serving size adjustment with automatic ingredient scaling

### AI Recipe Generation
- **Uses Replit AI Integrations (OpenAI)** - No API key required, charges billed to Replit credits
- Text-based input: Describe a recipe and AI fills in all details
- Image-based input: Upload a recipe photo and AI extracts ingredients and instructions
- Automatically fills: name, cuisine, servings, ingredients with quantities, step-by-step instructions

### Meal Planning
- Weekly calendar view (Monday-Sunday)
- Assign recipes to specific days
- Clear plan functionality

### Shopping List
- Automatic generation from planned recipes
- Organized by food categories: Protein, Grains, Produce, Dairy, Other
- Consolidated ingredient quantities

## Tech Stack

- **Frontend**: React, TypeScript, TanStack Query, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Replit AI Integrations (OpenAI gpt-4o for vision and text)

## API Endpoints

### Recipes
- `GET /api/recipes` - List all recipes
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/generate-ai` - AI recipe generation

### Meal Plan
- `GET /api/plan` - Get weekly plan
- `POST /api/plan` - Add recipe to plan
- `DELETE /api/plan/:id` - Remove from plan
- `DELETE /api/plan` - Clear entire plan

### Shopping List
- `GET /api/shopping-list` - Generate shopping list from plan

## Recent Changes

- **2026-01-25**: Added AI-powered recipe creation using Replit AI Integrations
- **2026-01-25**: Added delete recipe functionality with confirmation dialog
- **2026-01-25**: Added create/edit recipe dialogs with ingredient and instruction management
