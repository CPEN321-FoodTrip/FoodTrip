import { body } from "express-validator";
import { RouteController } from "../controllers/RouteController";

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
];
