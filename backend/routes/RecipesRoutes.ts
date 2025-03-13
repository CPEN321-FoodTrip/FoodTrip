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
  {
    method: "get",
    route: "/get-recipe",
    action: controller.getRecipe,  
    validation: [],
  },

  {
    method: "get",
    route: "/get-recipe-from-route",
    action: controller.getRecipefromRoute,
    validation: [],
  },

  {
    method: "delete",
    route: "/delete-recipe",
    action: controller.deleteRecipe,
    validation: [],

  },

  // {
  //   method: "get",
  //   route: "/get-recipe-from-database",
  //   action: controller.getRecipefromDatabase,  
  //   validation: [],
  // },
  {
    method: "get",
    route: "/newsearch",
    action: controller.newfetch,  
    validation: [],
  },

];
