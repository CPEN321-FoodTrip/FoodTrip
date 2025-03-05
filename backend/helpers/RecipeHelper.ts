import { ObjectId } from "mongodb";
import { client } from "../services";
import { RecipeSearchParams, EdamamApiResponse } from '../recipe.types';
import { RouteStop } from './RouteHelpers';

const BASE_URL = 'https://api.edamam.com/api/recipes/v2';
const appId = process.env.EDAMAM_APP_ID;
const apikey = process.env.EDAMAM_API_KEY;
// constants for recipes saved in MongoDB
const DB_NAME = "recipes";
const COLLECTION_NAME = "recipes";

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

// // constants for GeoNames data
// const CITIES_DB_NAME = "geonames";
// const CITIES_COLLECTION_NAME = "cities";
// const GEONAMES_FILE = "data/cities15000.txt";

export interface Recipe {
  recipeName: string;
  recipeID: number;
  url:string;
  ingredients:string[];
}

interface EdamamResponse {
    hits: Array<{ 
      recipe: {
        label: string;
        uri: string;
        url: string;
        ingredientLines: string[];
      } 
    }>;
  }

export async function fetchRecipe(query: string): Promise<Recipe[]> {
    try {
      if (!appId || !apikey) {
        throw new Error("Edamam App ID or API Key is missing");
      }
  
      const params = new URLSearchParams({
        type: 'public',
        q: query,
        app_id: appId,
        app_key: apikey,
      });
  
      const response = await fetch(`${BASE_URL}?${params.toString()}`);     
  
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Edamam API Error: ${response.status} - ${errorBody}`);
      }
  
      const data: EdamamResponse = await response.json();
      
      return data.hits.map((hit) => ({
        recipeName: hit.recipe.label || '',
        // Convert URI to a numeric ID or use a consistent approach
        recipeID: parseInt(hit.recipe.uri.split('_')[1] || '0', 10),
        url: hit.recipe.url,
        ingredients: hit.recipe.ingredientLines || [],
      }));
  
    } catch (error) {
      console.error('Detailed recipe fetch error:', error);
      throw error;
    }
  }

// export async function getRecipesfromRoute(tripID: string,userID:string): Promise<Recipe[]> {
export async function getRecipesfromRoute(tripID: string): Promise<Recipe[]> { //currently all tripIDs are unique
  const db = client.db(ROUTES_DB_NAME);
  const collection = db.collection(ROUTES_COLLECTION_NAME);
  try{
    const route = await collection.findOne({ _id: new ObjectId(tripID) });
    const result: Recipe[] = [];

    if (!route){
        throw new Error("No trip found under that ID");
    }

    const stopNames: string[] = [];
    route.stops.forEach((stop: RouteStop) =>{
        const stopName = stop.location.name;
        stopNames.push(stopName);
    });
    if (stopNames){
        for (const name of stopNames){
            const recipe = await fetchRecipe(name);
            result.push(recipe[0]);
        }
    }
    return result;
  }
  catch (error) {
    console.error('Create recipes from trip error:', error);
    throw error;
  }   
}
  
  // save recipe to MongoDB and return ID
  export async function saveRecipeToDatabase(
    userID: string,
    recipeName: {}
  ): Promise<ObjectId> {
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
  
    const result = await collection.insertOne({ userID, ...recipeName });
    return result.insertedId;
  }
  


