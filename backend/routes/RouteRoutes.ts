import { body } from "express-validator";
import { RouteController as RouteController } from "../controllers/RouteController";

const controller = new RouteController();

export const RouteRoutes = [
  {
    method: "post",
    route: "/routes",
    action: controller.createRoute,
    validation: [
      body("origin").exists().isString(),
      body("destination").exists().isString(),
      body("numStops").exists().isInt(),
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
