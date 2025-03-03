import { NextFunction, Request, Response } from "express";
import { generateRouteData, generateRouteStops } from "../helpers/RouteHelpers";

export class RouteController {
  async generateRoute(req: Request, res: Response, next: NextFunction) {
    const { origin, destination, numStops } = req.body;

    if (!origin || !destination || !numStops || numStops < 1) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    try {
      const route = await generateRouteData(origin, destination, numStops);
      res.json(route);
    } catch (error) {
      console.error("Error generating route:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal error" });
      }
    }
  }
}
