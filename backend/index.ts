import express, { NextFunction, Request, Response } from "express";
import { client } from "./services";
import { RouteRoutes } from "./routes/RouteRoutes";
import { DiscountRoutes } from "./routes/DiscountRoutes";
import { validationResult } from "express-validator";
import morgan from "morgan";
import { initializeGeoNamesDatabase } from "./helpers/RouteHelpers";

const app = express();

app.use(express.json());
app.use(morgan("tiny"));

const Routes = [...RouteRoutes, ...DiscountRoutes];

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

client
  .connect()
  .then(async () => {
    console.log("Connected to MongoDB");

    await initializeGeoNamesDatabase();

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
