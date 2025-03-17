import { body } from "express-validator";
import { deleteRecipes, getRecipes } from "../controllers/RecipeController";
import { createRecipesfromRoute } from "../helpers/RecipeHelper";

export const RecipeRoutes = [
  {
    method: "post",
    route: "/recipes",
    action: createRecipesfromRoute,
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
    action: getRecipes,
    validation: [],
  },
  {
    method: "delete",
    route: "/recipes/:id",
    action: deleteRecipes,
    validation: [],
  },
];
