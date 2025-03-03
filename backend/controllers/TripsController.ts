import { Request, Response, NextFunction } from "express";
import { generateRouteData } from "../helpers/RouteHelpers";
import { getTripsData, storeTripData } from "../helpers/TripsHelpers";

export class TripsController {
  async getTrips(req: Request, res: Response, next: NextFunction) {
    const userID = req.query.userID as string;

    if (!userID) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    try {
      const trips = await getTripsData(userID);
      res.json(trips);
    } catch (error) {
      console.error("Error getting trips:", error);
      res.status(500).json({ error: "Internal error" });
    }
  }

  async storeTrip(req: Request, res: Response, next: NextFunction) {
    const { userID, route, recipes } = req.body;

    if (!userID || !route || !recipes) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    try {
      await storeTripData(userID, route, recipes);
      res.json({ message: "Trip stored successfully" });
    } catch (error) {
      console.error("Error storing trip:", error);
      res.status(500).json({ error: "Internal error" });
    }
  }

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

    // generate recipes
    const recipes = {};

    // generate ingredients
    // generate shopping list

    // store trip
    try {
      await storeTripData(userID, route, recipes);
      res.json({ message: "Trip created successfully" });
    } catch (error) {
      console.error("Error storing trip:", error);
      res.status(500).json({ error: "Internal error" });
    }

    // [optional] check discounts
    // return trip
  }
}
