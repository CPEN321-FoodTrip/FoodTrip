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
      origin
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

      console.log(
        `Route from ${start.name} to ${end.name} with ${stops.length} stops:`
      );
      console.log(
        `Total distance: ${calculateDistance(start, end).toFixed(2)} km`
      );

      console.log(`Start: ${start.name}`);
      stops.forEach((stop, index) => {
        console.log(
          `Stop ${index + 1}: ${
            stop.location.name
          } - ${stop.distanceFromStart.toFixed(2)} km from start`
        );
      });
      console.log(`End: ${end.name}`);
      res.json({
        start_location: start.name,
        end_location: end.name,
        stops: stops,
      });
    } catch (error) {
      console.error("Error generating route:", error);
      res.status(500).json({ error: "Error generating route" });
    }
  }
}
