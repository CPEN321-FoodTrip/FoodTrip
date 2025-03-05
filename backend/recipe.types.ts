export interface RecipeSearchParams {
    query: string;
    diet?: string[];
    health?: string[];
    cuisineType?: string[];
    mealType?: string[];
    calories?: string;
    pageSize?: number;
  }
  
  export interface EdamamRecipe {
    uri: string;
    label: string;
    image: string;
    source: string;
    url: string;
    yield: number;
    dietLabels: string[];
    healthLabels: string[];
    cautions: string[];
    ingredientLines: string[];
    calories: number;
    totalWeight: number;
    cuisineType?: string[];
    mealType?: string[];
    dishType?: string[];
  }
  
  export interface EdamamApiResponse {
    hits: Array<{
      recipe: EdamamRecipe;
    }>;
    count: number;
  }