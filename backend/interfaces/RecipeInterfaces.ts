export interface Recipe {
  recipeName: string;
  recipeID: number;
  url: string;
  ingredients: string[];
}

export interface EdamamResponse {
  hits: Array<{
    recipe: {
      label: string;
      uri: string;
      url: string;
      ingredientLines: string[];
    };
  }>;
}
