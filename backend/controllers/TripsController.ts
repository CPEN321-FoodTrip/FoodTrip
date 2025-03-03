import { Request, Response, NextFunction } from "express";
import { generateRouteData } from "../helpers/RouteHelpers";

export class TripsController {
  async getTrips(req: Request, res: Response, next: NextFunction) {}

  async createTrip(req: Request, res: Response, next: NextFunction) {
    const { userID, origin, destination, numStops } = req.body;

    if (!userID || !origin || !destination || !numStops || numStops < 1) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    // generate route
    let route;
    try {
      route = await generateRouteData(origin, destination, numStops);
    } catch (error) {
      console.error("Error generating route:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal error" });
      }
      return;
    }

    // save route

    // generate recipes
    // save recipes
    // generate ingredients
    // save ingredients
    // generate shopping list
    // save shopping list
    // [optional] check discounts
    // return trip
  }
}
