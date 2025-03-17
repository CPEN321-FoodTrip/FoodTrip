import express, { NextFunction, Request, Response } from "express";
import { client, initializeClient, initializeFirebaseAdmin } from "./services";
import { RouteRoutes } from "./routes/RouteRoutes";
import { DiscountRoutes } from "./routes/DiscountRoutes";
import { validationResult } from "express-validator";
import morgan from "morgan";
import { initializeGeoNamesDatabase } from "./helpers/RouteHelpers";
import { RecipeRoutes } from "./routes/RecipesRoutes";
import { UserRoutes } from "./routes/UserRoutes";
import { NotificationRoutes } from "./routes/NotificationRoutes";
import { PreferenceRoutes } from "./routes/PreferenceRoutes";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan("tiny"));

const Routes = [
  ...RouteRoutes,
  ...DiscountRoutes,
  ...RecipeRoutes,
  ...UserRoutes,
  ...NotificationRoutes,
  ...PreferenceRoutes,
];

Routes.forEach((route) => {
  (app as express.Application)[route.method as keyof express.Application](
    route.route,
    route.validation ?? [],
    async (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        await route.action(req, res, next);
      } catch (err) {
        console.error(err);
        res.status(500);
      }
    }
  );
});

function startServer() {
  initializeClient();
  client
    .connect()
    .then(async () => {
      console.debug("Connected to MongoDB");

      initializeFirebaseAdmin();
      await initializeGeoNamesDatabase();

      app.listen(process.env.PORT, () => {
        console.debug(`Server is running on port ${process.env.PORT}`);
      });
    })
    .catch((err: Error) => {
      console.error(err);
      client.close();
    });
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

const errorHandle = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", err.message);
  console.error("Stack trace:", err.stack);

  res.status(500).json({ error: "Internal server error" });
  next(err);
};

app.use(errorHandle);

export default app; // needed for testing
