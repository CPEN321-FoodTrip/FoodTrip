import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import axios from "axios";
import polyline from "@mapbox/polyline";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.post(
  "/generate-route",
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
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
    } catch (error) {
      console.error("Error generating route:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

const client = new MongoClient(
  process.env.DB_URI ?? "mongodb://localhost:27017"
);

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(process.env.PORT, () => {
      console.log("Server is running on port " + process.env.PORT);
    });
  })
  .catch((err: Error) => {
    console.error(err);
    client.close();
  });

const errorHandle = (req: Request, res: Response) => {
  console.error(res.status);
};

app.use(errorHandle);
