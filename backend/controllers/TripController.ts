import { NextFunction, Request, Response } from "express";
import {
  Location,
  generateRouteStops,
  calculateDistance,
} from "../helpers/TripHelpers";

export class TripController {
  sayHello(req: Request, res: Response) {
    res.send("Hello World!");
  }

  async generateRoute(req: Request, res: Response, next: NextFunction) {
    const { origin, destination, numStops } = req.body;

    if (!origin || !destination || !numStops || numStops < 1) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    const start: Location = {
      name: "London",
      countryCode: "UK",
      latitude: 51.5072,
      longitude: 0.1276,
      population: 8600000,
    };

    const end: Location = {
      name: "Warsaw",
      countryCode: "PL",
      latitude: 52.2297,
      longitude: 21.0122,
      population: 1800000,
    };

    try {
      const stops = await generateRouteStops(start, end, 3);

      console.log(
        `Route from ${start.name} to ${end.name} with ${stops.length} stops:`
      );
      console.log(
        `Total distance: ${calculateDistance(start, end).toFixed(2)} km`
      );

      console.log(`Start: ${start.name}, ${start.countryCode}`);
      stops.forEach((stop, index) => {
        console.log(
          `Stop ${index + 1}: ${stop.location.name}, ${
            stop.location.countryCode
          } - ${stop.distanceFromStart.toFixed(2)} km from start`
        );
      });
      console.log(`End: ${end.name}, ${end.countryCode}`);
      res.json({
        start_location: start.name,
        end_location: end.name,
        stops: stops,
      });
    } catch (error) {
      console.error("Error generating route:", error);
    }
  }
}
