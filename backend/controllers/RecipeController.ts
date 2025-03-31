import { NextFunction, Request, Response } from "express";
import {
  saveRecipesToDb,
  getRecipesFromDb,
  createRecipesfromRoute,
  deleteRecipesFromDb,
} from "../helpers/RecipeHelper";
import { ObjectId } from "mongodb";
import { getRouteFromDb } from "../helpers/RouteHelpers";
import { getAllergiesFromDb } from "../helpers/PreferenceHelper";

// generate a list of recipes from a route
// POST /recipes
export const createRecipes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // validation of params performed by express-validator middleware
    const { tripID, userID } = req.body as { tripID: string; userID: string };
    if (!ObjectId.isValid(tripID)) {
      return res.status(400).json({ error: "Invalid tripID format" });
    }

    const route = await getRouteFromDb(tripID);
    if (!route) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const allergies = await getAllergiesFromDb(userID);
    if (!allergies) {
      return res.status(404).json({ error: "User not found" });
    }

    const recipes = await createRecipesfromRoute(
      route,
      allergies.map((allergyObj) => allergyObj.allergy),
    );
    if (!recipes) {
      return res
        .status(404)
        .json({ error: "Could not find recipes that match user preferences" });
    }

    // save recipes to db
    await saveRecipesToDb(tripID, recipes);
    res.status(201).json(recipes);
  } catch (error) {
    next(error);
  }
};

// get all recipes from a trip
// GET /recipes/:id
export const getRecipes = async (
  req: Request,
  res: Response,
  next: NextFunction,
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
  next: NextFunction,
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
