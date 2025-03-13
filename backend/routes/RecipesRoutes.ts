import { body } from "express-validator";
import { RecipeController } from "../controllers/RecipeController";

const controller = new RecipeController();

export const RecipeRoutes = [
  {
    method: "post",
    route: "/recipes",
    action: controller.createRecipesfromRoute,
    validation: [
      body("tripID")
        .exists()
        .isString()
        .withMessage("tripID is required and must be a string"),
    ],
  },
  {
    method: "get",
    route: "/recipes/:id",
    action: controller.getRecipes,
    validation: [],
  },
  {
    method: "delete",
    route: "/recipes/:id",
    action: controller.deleteRecipes,
    validation: [],
  },
];
