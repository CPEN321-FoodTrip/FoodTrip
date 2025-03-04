import { body } from "express-validator";
import { RouteController as RouteController } from "../controllers/RouteController";

const controller = new RouteController();

export const RouteRoutes = [
  {
    method: "post",
    route: "/generate-route",
    action: controller.generateRoute,
    validation: [
      body("origin").exists().isString(),
      body("destination").exists().isString(),
      body("numStops").exists().isInt(),
    ],
  },
  {
    method: "get",
    route: "/get-route",
    action: controller.getRoute,
    validation: [],
  },
  {
    method: "get",
    route: "/get-routes",
    action: controller.getRoutes,
    validation: [],
  },
];
