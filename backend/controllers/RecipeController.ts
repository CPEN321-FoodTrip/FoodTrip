import { NextFunction, Request, Response } from "express";
import { 
    fetchRecipe,
    saveRecipeToDatabase,
    getRecipeFromDatabase,
    Recipe,
} from '../helpers/RecipeHelper';

export class RecipeController {
  async getRecipes(req: Request, res: Response, next: NextFunction) {
    const query = req.query.query as string;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: "Invalid or missing request parameters" });
      return;
    }
    
    try {
      const recipes = await fetchRecipe(query);        
      res.json({ 
        success: true, 
        data: recipes,
        total: recipes.length
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch recipes",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // async getSingle(req: Request, res: Response, next: NextFunction) {
  //   const recipeName = req.query.name as string;
  //   if (!recipeName){
  //     throw new Error("Recipe name is required");
  //   }

  //   try {
  //     const recipe = await getSingle(recipeName);

  //   }
  //   catch(error){
  //     console.error("Error getting recipe:", error);
  //   res.status(500).json({ error: "Error getting recipe" });
  //   }
  // }

  async getRecipe(req: Request, res: Response, next: NextFunction) {
    // const recipeName = req.query.recipeName as string;
    const recipeID = req.query.recipeID as string;

    if (!recipeID) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    const recipe = await getRecipeFromDatabase(recipeID);
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.json(recipe);
  }
}


