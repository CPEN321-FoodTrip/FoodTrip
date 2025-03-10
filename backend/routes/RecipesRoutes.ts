import { body } from "express-validator";
import { RecipeController } from "../controllers/RecipeController";

const controller = new RecipeController();

export const RecipeRoutes = [
  {
    method: "get",
    route: "/search",
    action: controller.getRecipes,  
    validation: [],
  },

  // {
  //   method: "get",
  //   route: "/single-recipe",
  //   action: controller.getSingle,  
  //   validation: [],
  // },

  {
    method: "get",
    route: "/get-recipe",
    action: controller.getRecipe,  
    validation: [],
  }

];
