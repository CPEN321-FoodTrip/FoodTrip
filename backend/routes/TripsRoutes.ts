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
    route: "/trips",
    action: controller.createTrip,
    validation: [],
  },
];
