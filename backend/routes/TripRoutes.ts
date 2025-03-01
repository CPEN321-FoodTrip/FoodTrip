import { body } from "express-validator";
import { TripController } from "../controllers/TripController";

const controller = new TripController();

export const TripRoutes = [
  {
    method: "get",
    route: "/",
    action: controller.sayHello,
    validation: [],
  },
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
