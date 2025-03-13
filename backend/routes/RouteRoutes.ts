import { body } from "express-validator";
import { RouteController as RouteController } from "../controllers/RouteController";

const controller = new RouteController();

export const RouteRoutes = [
  {
    method: "post",
    route: "/routes",
    action: controller.createRoute,
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
    action: controller.getRoute,
    validation: [],
  },
  {
    method: "delete",
    route: "/routes/:id",
    action: controller.deleteRoute,
    validation: [],
  },
];
