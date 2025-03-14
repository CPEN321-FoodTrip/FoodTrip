import { Request, Response, NextFunction } from "express";
import { getUserRoutesFromDb } from "../helpers/UserHelper";

export class UserController {
  // get all routes for a user
  // GET /users/:userID/routes
  async getUserRoutes(req: Request, res: Response, next: NextFunction) {
    try {
      const userID = req.params.userID;

      if (!userID || userID.trim() === "") {
        return res.status(400).json({ error: "userID is required" });
      }

      const routes = await getUserRoutesFromDb(userID);
      // route is empty array if user does not exist
      res.json(routes);
    } catch (error) {
      next(error);
    }
  }
}
