import { NextFunction, Request, Response } from "express";
import {
  Location,
  generateRouteStops,
  getRouteFromDatabase,
  saveRouteToDatabase,
  getRoutesFromDatabase,
} from "../helpers/RouteHelpers";

export class RouteController {
  async generateRoute(req: Request, res: Response, next: NextFunction) {
    const { userID, origin, destination, numStops } = req.body;

    if (!userID || !origin || !destination || !numStops || numStops < 1) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    const originURL = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
      origin
    )}&format=json&limit=1`;

    const originResponse = await fetch(originURL);
    const originData = await originResponse.json();

    if (originData.length === 0) {
      res.status(400).json({ error: "Could not locate start city" });
      return;
    }

    const originCity = originData[0];

    const start: Location = {
      name: originCity.name,
      latitude: parseFloat(originCity.lat),
      longitude: parseFloat(originCity.lon),
      population: 0, // not used for start location
    };

    const destinationURL = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
      destination
    )}&format=json&limit=1`;

    const destinationResponse = await fetch(destinationURL);
    const destinationData = await destinationResponse.json();

    if (destinationData.length === 0) {
      res.status(400).json({ error: "Could not locate end city" });
      return;
    }

    const destinationCity = destinationData[0];

    const end: Location = {
      name: destinationCity.name,
      latitude: parseFloat(destinationCity.lat),
      longitude: parseFloat(destinationCity.lon),
      population: 0, // not used for end location
    };

    try {
      const stops = await generateRouteStops(start, end, numStops);
      const route = {
        start_location: {
          name: start.name,
          latitude: start.latitude,
          longitude: start.longitude,
        },
        end_location: {
          name: end.name,
          latitude: end.latitude,
          longitude: end.longitude,
        },
        stops: stops,
      };

      const tripID = await saveRouteToDatabase(userID, route);
      const response = { ...route, tripID };

      res.json(response);
    } catch (error) {
      console.error("Error generating route:", error);
      res.status(500).json({ error: "Error generating route" });
    }
  }

  // get route information
  async getRoute(req: Request, res: Response, next: NextFunction) {
    const tripID = req.query.tripID as string;

    if (!tripID) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    // get route information from database
    const route = await getRouteFromDatabase(tripID);
    if (!route) {
      res.status(404).json({ error: "Route not found" });
      return;
    }

    res.json(route);
  }

  // get all routes for user
  async getRoutes(req: Request, res: Response, next: NextFunction) {
    const userID = req.query.userID as string;

    if (!userID) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    const routes = await getRoutesFromDatabase(userID);
    res.json(routes);
  }
}
