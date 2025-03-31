import { client } from "../services";
import { Route, RouteStop } from "../interfaces/RouteInterfaces";
import {
  Recipe,
  EdamamResponse,
  RecipeDBEntry,
} from "../interfaces/RecipeInterfaces";

const EDAMAM_BASE_URL = "https://api.edamam.com/api/recipes/v2";

// constants for recipes saved in MongoDB
const RECIPE_DB_NAME = "recipes";
const RECIPE_COLLECTION_NAME = "recipes";

// helper function to fetch recipe data from Edamam API
export async function fetchRecipe(query: string): Promise<Recipe[]> {
  try {
    const params = new URLSearchParams({
      type: "public",
      q: query,
      app_id: process.env.EDAMAM_APP_ID ?? "",
      app_key: process.env.EDAMAM_API_KEY ?? "",
    });

    const response = await fetch(`${EDAMAM_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Edamam API Error`);
    }

    const data: EdamamResponse = await response.json();

    return data.hits.map((hit) => ({
      recipeName: hit.recipe.label || "",
      recipeID: parseInt(hit.recipe.uri.split("_")[1] || "0", 10),
      url: hit.recipe.url,
      ingredients: hit.recipe.ingredients,
    }));
  } catch (error) {
    console.error("Detailed recipe fetch error:", error);
    throw error;
  }
}

// helper function to fetch recipes that don't contain user's allergies
export async function createRecipesfromRoute(
  route: Route,
  allergies: string[],
): Promise<Recipe[] | null> {
  try {
    if (route.stops.length === 0) {
      throw new Error("No stops found in route");
    }

    const stopNames: string[] = [];
    const startname: string = route.start_location.name;
    const endname: string = route.end_location.name;

    stopNames.push(startname);
    route.stops.forEach((stop: RouteStop) => {
      const stopName = stop.location.name;
      stopNames.push(stopName);
    });
    stopNames.push(endname);

    const recipes: Recipe[] = [];
    for (const name of stopNames) {
      let recipe = await fetchRecipe(name);

      // filter out recipes that contain user's allergies
      for (const allergy of allergies) {
        recipe = recipe.filter((r) => {
          return !r.ingredients.some((ingredient) =>
            ingredient.food.match(new RegExp(allergy, "i")),
          );
        });
      }

      // no recipes found that match user's preferences
      if (!recipe) {
        return null;
      }

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
  recipes: Recipe[],
): Promise<void> {
  const db = client.db(RECIPE_DB_NAME);
  const collection = db.collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME);
  await collection.insertOne({
    tripID,
    recipes,
  });
}

export async function getRecipesFromDb(
  tripID: string,
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
