import { ObjectId } from "mongodb";
import { client } from "../services";

import { RouteDBEntry, RouteStop } from "../interfaces/RouteInterfaces";
import {
  Recipe,
  EdamamResponse,
  RecipeDBEntry,
} from "../interfaces/RecipeInterfaces";

const EDAMAM_BASE_URL = "https://api.edamam.com/api/recipes/v2";

// constants for recipes saved in MongoDB
const RECIPE_DB_NAME = "recipes";
const RECIPE_COLLECTION_NAME = "recipes";

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

// helper function to fetch recipe data from Edamam API
export async function fetchRecipe(query: string): Promise<Recipe[]> {
  try {
    if (!process.env.EDAMAM_APP_ID || !process.env.EDAMAM_API_KEY) {
      throw new Error("Edamam API credentials are missing");
    }
    const params = new URLSearchParams({
      type: "public",
      q: query,
      app_id: process.env.EDAMAM_APP_ID,
      app_key: process.env.EDAMAM_API_KEY,
    });

    const response = await fetch(`${EDAMAM_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      const errorBody = await response.text();  ///unreached
      throw new Error(`Edamam API Error: ${response.status} - ${errorBody}`);
    }

    const data: EdamamResponse = await response.json();

    return data.hits.map((hit) => ({
      recipeName: hit.recipe.label || "",
      recipeID: parseInt(hit.recipe.uri.split("_")[1] || "0", 10), 
      url: hit.recipe.url,
      ingredients: hit.recipe.ingredientLines,
    }));
  } catch (error) {
    console.error("Detailed recipe fetch error:", error); 
    throw error;
  }
}

// helper function to extract locations from a route and fetch recipes
export async function createRecipesfromRoute(
  tripID: string
): Promise<Recipe[] | null> {
  try {
    const route_db = client.db(ROUTES_DB_NAME);
    const route_collection = route_db.collection<RouteDBEntry>(
      ROUTES_COLLECTION_NAME
    );
    const result = await route_collection.findOne({
      _id: new ObjectId(tripID),
    });
    if (!result) {
      return null;
    }
    if (result.route.stops.length === 0) { ////////////
      throw new Error("No stops found in route"); 
    }
    const stopNames: string[] = [];

    const startname:string = result.route.start_location.name;
    const endname:string = result.route.end_location.name;
    stopNames.push(startname);
    result.route.stops.forEach((stop: RouteStop) => {
      const stopName = stop.location.name;
      stopNames.push(stopName);
    });
    stopNames.push(endname);

    const recipes: Recipe[] = [];
    for (const name of stopNames) {
      const recipe = await fetchRecipe(name);
      recipes.push(recipe[0]); // choose top match recipe
    }
    return recipes;
  } catch (error) {
    console.error("Create recipes from trip error:", error);
    throw error; //////////////////////////////////////////
  }
}

export async function saveRecipesToDb(
  tripID: string,
  recipes: Recipe[]
): Promise<void> {
  const db = client.db(RECIPE_DB_NAME);
  const collection = db.collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME);

  await collection.insertOne({
    tripID,
    recipes,
  });
}

export async function getRecipesFromDb(
  tripID: string
): Promise<Recipe[] | null> {
  const result: RecipeDBEntry | null = await client
    .db(RECIPE_DB_NAME)
    .collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME)
    .findOne({ tripID });

  if (!result?.recipes) {
    return null;
  }
  return result.recipes;
}

export async function deleteRecipesFromDb(tripID: string): Promise<number> {
  const deletedCount: number = (
    await client
      .db(RECIPE_DB_NAME)
      .collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME)
      .deleteOne({ tripID })
  ).deletedCount;
  return deletedCount;
}
