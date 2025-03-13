import { NextFunction, Request, Response } from "express";
import { 
    fetchRecipe,
    saveRecipeToDatabase,
    getRecipeFromDatabase,
    Recipe,
    newfetchRecipe,
} from '../helpers/RecipeHelper';

export class RecipeController {
  async getRecipes(req: Request, res: Response) {
    const query = req.query.query as string;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: "Invalid or missing request parameters" });
      return;
    }
    
    try {
      const recipes = await fetchRecipe(query);        
      console.log(recipes);
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

  async getRecipe(req: Request, res: Response) {
    
  try{
      const { recipeName, recipeID, url } = req.query;

    if (!recipeID && !recipeID && !url) {
      res.status(400).json({ error: "Must provide recipeID, recipeName, or url" });
      return;
    }

    const recipe = await getRecipeFromDatabase({ 
      recipeName: recipeName as string, 
      recipeID: recipeID ? Number(recipeID) : undefined, 
      url: url as string
    });
    if (!recipe) {
      res.status(404).json({ error: "Recipe not found" });
      return;
    }

    res.json(recipe);
    }
    catch(error){
      console.error("Error getting recipe:", error);
      res.status(500).json({ error: "Error getting recipe" });
    }
  }

  async getRecipefromRoute(req: Request, res: Response) {

  }

  async deleteRecipe(req: Request, res: Response) {
    
  }

  async newfetch(req: Request, res: Response) {
    const query = req.query.query as string;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: "Invalid or missing request parameters" });
      return;
    }
    
    try {
      const recipes = await newfetchRecipe(query);
      console.log(recipes);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch recipes",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}


