import { NextFunction, Request, Response } from "express";
import {
  saveRecipesToDb,
  getRecipesFromDb,
  createRecipesfromRoute,
  deleteRecipesFromDb,
} from "../helpers/RecipeHelper";
import { ObjectId } from "mongodb";

// generate a list of recipes from a route
// POST /recipes
export const createRecipes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // validation of params performed by express-validator middleware
    const { tripID } = req.body as { tripID: string };
    if (!ObjectId.isValid(tripID)) {
      return res.status(400).json({ error: "Invalid tripID format" });
    }

    const recipes = await createRecipesfromRoute(tripID);
    if (!recipes) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // save recipes to db
    await saveRecipesToDb(tripID, recipes);  /// unreachable
    res.status(201).json(recipes);
  } catch (error) {
    next(error);                       /// unreachable
  }
};

// get all recipes from a trip
// GET /recipes/:id
export const getRecipes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tripID = req.params.id;
    if (!ObjectId.isValid(tripID)) {
      return res.status(400).json({ error: "Invalid tripID format" });
    }

    const recipes = await getRecipesFromDb(tripID);
    if (!recipes) {
      return res.status(404).json({ error: "No recipes found for tripID" });
    }

    res.status(200).json(recipes);
  } catch (error) {
    console.error("Error getting recipe:", error);  
    next(error);
  }
};

// delete all recipes from a trip
// DELETE /recipes/:id
export const deleteRecipes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tripID = req.params.id;
    if (!ObjectId.isValid(tripID)) {
      return res.status(400).json({ error: "Invalid tripID format" });
    }

    const result = await deleteRecipesFromDb(tripID);
    if (!result) {
      return res.status(404).json({ error: "No recipes found for tripID" });
    }
    res.status(200).json({ success: true, message: "Recipes deleted" });
  } catch (error) {
    next(error); 
  }
};
