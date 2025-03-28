export interface Recipe {
  recipeName: string;
  recipeID: number;
  url: string;
  ingredients: Ingredient[];
}

export interface EdamamResponse {
  hits: {
    recipe: {
      label: string;
      uri: string;
      url: string;
      ingredients: Ingredient[];
    };
  }[];
}

export interface Ingredient {
  text: string;
  quantity: number;
  measure: string;
  food: string;
  weight: number;
  foodId: string;
}

export interface RecipeDBEntry {
  tripID: string;
  recipes: Recipe[];
}
