import { NextFunction, Request, Response } from "express";
import axios from "axios";
import polyline from "@mapbox/polyline";

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

    // Get main route between two locations
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}&key=${
      process.env.GOOGLE_MAPS_API_KEY
    }`;
    const directionsResponse = await axios.get(directionsUrl);

    if (directionsResponse.data.status !== "OK") {
      res.status(400).json({ error: directionsResponse.data.error_message });
      return;
    }

    const route = directionsResponse.data.routes[0];
    const pathCoordinates = polyline.decode(route.overview_polyline.points);

    // Determine evenly spaced stop locations
    const stepSize = Math.floor(pathCoordinates.length / (numStops + 1));
    const stopCandidates = [];

    for (let i = 1; i <= numStops; i++) {
      stopCandidates.push(pathCoordinates[i * stepSize]);
    }

    // Find places near those stop candidates
    const stops = [];
    for (const [lat, lng] of stopCandidates) {
      const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&key=${process.env.GOOGLE_MAPS_API_KEY}`;
      const placesResponse = await axios.get(placesUrl);

      if (
        placesResponse.data.status === "OK" &&
        placesResponse.data.results.length > 0
      ) {
        const place = placesResponse.data.results[0]; // Pick first place found
        stops.push({
          name: place.name,
          location: place.geometry.location,
        });
      }
    }

    res.json({
      start_location: route.legs[0].start_location,
      end_location: route.legs[route.legs.length - 1].end_location,
      stops,
      path: pathCoordinates.map(([lat, lng]) => ({ lat, lng })),
    });
  }
}
