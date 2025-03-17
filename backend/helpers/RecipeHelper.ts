import { ObjectId } from "mongodb";
import { client } from "../services";

import { RouteStop } from "../interfaces/RouteInterfaces";
import { Recipe, EdamamResponse } from "../interfaces/RecipeInterfaces";

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
      throw new Error("Edamam App ID or API Key is missing");
    }

    const params = new URLSearchParams({
      type: "public",
      q: query,
      app_id: process.env.EDAMAM_APP_ID,
      app_key: process.env.EDAMAM_API_KEY,
    });

    const response = await fetch(`${EDAMAM_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      const errorBody = await response.text();
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
    const route_collection = route_db.collection(ROUTES_COLLECTION_NAME);
    const route = await route_collection.findOne({ _id: new ObjectId(tripID) });
    if (!route) {
      return null;
    }

    const recipes: Recipe[] = [];

    const stopNames: string[] = [];
    route.stops.forEach((stop: RouteStop) => {
      const stopName = stop.location.name;
      stopNames.push(stopName);
    });

    if (stopNames.length === 0) {
      throw new Error("No stops found in route");
    }

    for (const name of stopNames) {
      const recipe = await fetchRecipe(name);
      recipes.push(recipe[0]); // choose top match recipe
    }
    return recipes;
  } catch (error) {
    console.error("Create recipes from trip error:", error);
    throw error;
  }
}

export async function saveRecipesToDb(
  tripID: string,
  recipes: Recipe[]
): Promise<ObjectId> {
  const db = client.db(RECIPE_DB_NAME);
  const collection = db.collection(RECIPE_COLLECTION_NAME);

  const insertedId: ObjectId = (
    await collection.insertOne({
      tripID,
      recipes,
    })
  ).insertedId;
  return insertedId;
}

export async function getRecipesFromDb(tripID: string): Promise<unknown> {
  const recipes: unknown = await client
    .db(RECIPE_DB_NAME)
    .collection(RECIPE_COLLECTION_NAME)
    .findOne({ tripID });
  return recipes;
}

export async function deleteRecipesFromDb(tripID: string): Promise<number> {
  const deletedCount: number = (
    await client
      .db(RECIPE_DB_NAME)
      .collection(RECIPE_COLLECTION_NAME)
      .deleteOne({ tripID })
  ).deletedCount;
  return deletedCount;
}
