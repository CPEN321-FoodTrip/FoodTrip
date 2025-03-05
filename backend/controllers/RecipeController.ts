import { NextFunction, Request, Response } from "express";
import { 
    fetchRecipe,
    Recipe,
 } from '../helpers/RecipeHelper';

 export class RecipeController {
    async getRecipes(req: Request, res: Response, next: NextFunction) {
      const { query } = req.query;  // Prefer query params for GET requests
      
      // More robust validation
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ 
          success: false, 
          error: 'Valid query parameter is required' 
        });
      }
      
      try {
        const recipes = await fetchRecipe(query);
        
        // Consider adding more metadata
        res.json({ 
          success: true, 
          data: recipes,
          total: recipes.length
        });
      } catch (error) {
        // More informative error response
        res.status(500).json({ 
          success: false, 
          error: "Failed to fetch recipes",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
