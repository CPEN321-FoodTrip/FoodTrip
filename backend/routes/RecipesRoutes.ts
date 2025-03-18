import { body } from "express-validator";
import { createRecipes, deleteRecipes, getRecipes } from "../controllers/RecipeController";

export const RecipeRoutes = [
  {
    method: "post",
    route: "/recipes",
    action: createRecipes,
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
