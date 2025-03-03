import express, { NextFunction, Request, Response } from "express";
import { client } from "./services";
import { TripRoutes } from "./routes/TripRoutes";
import { DiscountRoutes } from "./routes/DiscountRoutes";
import { validationResult } from "express-validator";
import morgan from "morgan";
import { initializeDatabase } from "./helpers/TripHelpers";

const app = express();

app.use(express.json());
app.use(morgan("tiny"));

const Routes = [...TripRoutes, ...DiscountRoutes];

Routes.forEach((route) => {
  (app as any)[route.method](
    route.route,
    route.validation,
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

    await initializeDatabase();

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
