export interface Recipe {
  recipeName: string;
  recipeID: number;
  url: string;
  ingredients: string[];
}

export interface EdamamResponse {
  hits: {
    recipe: {
      label: string;
      uri: string;
      url: string;
      ingredientLines: string[];
    };
  }[];
}

export interface RecipeDBEntry {
  tripID: string;
  recipes: Recipe[];
}
