import { NextFunction, Request, Response } from "express";
import {
  saveRecipesToDb,
  getRecipesFromDb,
  createRecipesfromRoute,
  deleteRecipesFromDb,
} from "../helpers/RecipeHelper";
import { validationResult } from "express-validator";
import { ObjectId } from "mongodb";

export class RecipeController {
  // generate a list of recipes from a route
  // POST /recipes
  async createRecipesfromRoute(
    this:void, 
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tripID } = req.body as { tripID: string };

    try {
      const recipes = await createRecipesfromRoute(tripID);
      if (!recipes) {
        return res.status(404).json({ error: "Trip not found" });
      }

      // save recipes to db
      const insertId = await saveRecipesToDb(tripID, recipes);
      if (!insertId) {
        return res.status(500).json({ error: "Failed to save recipes" });
      }

      res.json(recipes);
    } catch (error) {
      next(error);
    }
  }

  // get all recipes from a trip
  // GET /recipes/:id
  async getRecipes(this:void, req: Request, res: Response, next: NextFunction) {
    try {
      const tripID = req.params.id;
      if (!ObjectId.isValid(tripID)) {
        return res.status(400).json({ error: "Invalid tripID format" });
      }

      const recipes = await getRecipesFromDb(tripID);
      if (!recipes) {
        return res.status(404).json({ error: "No recipes found for tripID" });
      }

      res.json(recipes);
    } catch (error) {
      console.error("Error getting recipe:", error);
      next(error);
    }
  }

  // delete all recipes from a trip
  // DELETE /recipes/:id
  async deleteRecipes(this:void, req: Request, res: Response, next: NextFunction) {
    try {
      const tripID = req.params.id;
      if (!ObjectId.isValid(tripID)) {
        return res.status(400).json({ error: "Invalid tripID format" });
      }

      const result = await deleteRecipesFromDb(tripID);
      if (!result) {
        return res.status(404).json({ error: "No recipes found for tripID" });
      }
      res.json({ success: true, message: "Recipes deleted" });
    } catch (error) {
      next(error);
    }
  }
}
