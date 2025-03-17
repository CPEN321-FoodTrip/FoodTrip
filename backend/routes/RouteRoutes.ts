import { body } from "express-validator";
import { createRoute, deleteRoute, getRoute } from "../controllers/RouteController";

export const RouteRoutes = [
  {
    method: "post",
    route: "/routes",
    action: createRoute,
    validation: [
      body("userID")
        .exists()
        .isString()
        .withMessage("userID is required and must be a string"),
      body("origin")
        .exists()
        .isString()
        .withMessage("origin is required and must be a string"),
      body("destination")
        .exists()
        .isString()
        .withMessage("destination is required and must be a string"),
      body("numStops")
        .exists()
        .isInt()
        .withMessage("numStops is required and must be an integer"),
    ],
  },
  {
    method: "get",
    route: "/routes/:id",
    action: getRoute,
    validation: [],
  },
  {
    method: "delete",
    route: "/routes/:id",
    action: deleteRoute,
    validation: [],
  },
];
