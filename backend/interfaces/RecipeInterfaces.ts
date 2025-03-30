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
  measure: string | null;
  food: string;
  weight: number;
  foodCategory: string;
  foodId: string;
  image: string;
}

export interface RecipeDBEntry {
  tripID: string;
  recipes: Recipe[];
}
