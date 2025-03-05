import { body } from "express-validator";
import { RecipeController } from "../controllers/RecipeController";

const controller = new RecipeController();

export const RecipeRoutes = [
  {
    method: "get",
    route: "/search",
    action: controller.getRecipes,  
    validation: [
        body("recipeName").exists().isString(),
    ],
  }
];
