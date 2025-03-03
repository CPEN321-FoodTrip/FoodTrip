import { body } from "express-validator";
import { TripsController } from "../controllers/TripsController";

const controller = new TripsController();

export const TripsRoutes = [
  {
    method: "get",
    route: "/trips",
    action: controller.getTrips,
    validation: [],
  },
  {
    method: "post",
    route: "/trips/store",
    action: controller.storeTrip,
    validation: [
      body("userID").exists().isString(),
      body("route").exists().isObject(),
      body("recipes").exists().isObject(),
    ],
  },
  {
    method: "post",
    route: "/trips",
    action: controller.createTrip,
    validation: [
      body("userID").exists().isString(),
      body("origin").exists().isString(),
      body("destination").exists().isString(),
      body("numStops").exists().isInt(),
    ],
  },
];
