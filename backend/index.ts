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

const app = express();

app.use(express.json());
app.use(morgan("tiny"));

const Routes = [
  ...RouteRoutes,
  ...DiscountRoutes,
  ...RecipeRoutes,
  ...UserRoutes,
  ...NotificationRoutes,
];

Routes.forEach((route) => {
  (app as any)[route.method](
    route.route,
    route.validation || [],
    async (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        await route.action(req, res, next);
      } catch (err) {
        console.log(err);
        res.status(500);
      }
    }
  );
});

async function startServer() {
  initializeClient();
  client
    .connect()
    .then(async () => {
      console.log("Connected to MongoDB");

      initializeFirebaseAdmin();
      await initializeGeoNamesDatabase();

      app.listen(process.env.PORT, () => {
        console.log("Server is running on port " + process.env.PORT);
      });
    })
    .catch((err: Error) => {
      console.error(err);
      client.close();
    });
}

if (process.env.NODE_ENV !== "test") {
  void startServer();
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
};

app.use(errorHandle);

export default app; // needed for testing
