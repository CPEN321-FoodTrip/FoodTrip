import { NextFunction, Request, Response } from "express";
import {
  generateRouteStops,
  getRouteFromDb,
  saveRouteToDb,
  deleteRouteFromDb,
  fetchCityData,
} from "../helpers/RouteHelpers";
import { Location } from "../interfaces/RouteInterfaces";
import { ObjectId } from "mongodb";

export class RouteController {
  // create a new route
  // POST /routes
  async createRoute(req: Request, res: Response, next: NextFunction) {
    const { userID, origin, destination, numStops } = req.body;

    if (!userID || !origin || !destination || !numStops) {
      return res.status(400).json({
        error: "userID, origin, destination and numStops are required",
      });
    }
    if (numStops < 1) {
      return res
        .status(400)
        .json({ error: "Number of stops must be at least 1" });
    }

    try {
      const originCityData = await fetchCityData(origin);
      const start: Location = {
        name: origin,
        latitude: parseFloat(originCityData.lat),
        longitude: parseFloat(originCityData.lon),
        population: 0, // not used for start location
      };

      const destinationCityData = await fetchCityData(destination);
      const end: Location = {
        name: destination,
        latitude: parseFloat(destinationCityData.lat),
        longitude: parseFloat(destinationCityData.lon),
        population: 0, // not used for end location
      };

      const stops = await generateRouteStops(start, end, numStops);

      const route = {
        start_location: {
          name: origin,
          latitude: start.latitude,
          longitude: start.longitude,
        },
        end_location: {
          name: destination,
          latitude: end.latitude,
          longitude: end.longitude,
        },
        stops: stops,
      };

      const tripID = await saveRouteToDb(userID, route);
      const response = { tripID, ...route };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // get information about a particular route
  // GET /routes/:id
  async getRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const tripID = req.params.id;

      if (!ObjectId.isValid(tripID)) {
        return res.status(400).json({ error: "Invalid tripID format" });
      }

      const route = await getRouteFromDb(tripID);

      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }

      res.json(route);
    } catch (error) {
      next(error);
    }
  }

  // delete a route
  // DELETE /routes/:id
  async deleteRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const tripID = req.params.id;

      if (!tripID) {
        return res.status(400).json({ error: "tripID is required" });
      }

      const result = await deleteRouteFromDb(tripID);

      if (!result) {
        return res.status(404).json({ error: "Route not found" });
      }

      res.json({ success: true, message: "Route deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
