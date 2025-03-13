import { Request, Response, NextFunction } from "express";
import { getUserRoutesFromDb } from "../helpers/UserHelper";

export class UserController {
  // get all routes for a user
  // GET /users/:userID/routes
  async getUserRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      const userID = req.params.userID;

      if (!userID) {
        return res.status(400).json({ error: "userID is required" });
      }

      const routes = await getUserRoutesFromDb(userID);

      if (routes === null || routes === undefined) {
        return res.status(404).json({ error: "No routes found for the user" });
      }

      res.json(routes);
    } catch (error) {
      next(error);
    }
  }
}
