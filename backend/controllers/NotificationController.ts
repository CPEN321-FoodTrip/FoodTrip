import { NextFunction, Request, Response } from "express";
import { UserNotificationData } from "../interfaces/NotificationInterfaces";
import {
  addTokenToDb,
  getTokenFromDb,
  removeTokenFromDb,
} from "../helpers/NotificationHelper";

export class NotificationController {
  // POST /notifications
  async subscribe(req: Request, res: Response, next: NextFunction) {
    // validation of params performed by express-validator middleware
    const { userID, fcmToken }: UserNotificationData = req.body;

    try {
      const prevToken = await getTokenFromDb(userID);
      if (prevToken) {
        return res.status(400).json({ error: "Already subscribed" });
      }

      const result = await addTokenToDb(userID, fcmToken);
      if (!result) {
        throw new Error("Failed to subscribe");
      }

      res.status(201).json({ message: "Subscribed successfully" });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /notifications/:id
  async unsubscribe(req: Request, res: Response, next: NextFunction) {
    const userID = req.params.id;

    try {
      const result = await removeTokenFromDb(userID);
      if (!result) {
        return res.status(400).json({ error: "Not subscribed" });
      }

      res.status(200).json({ message: "Unsubscribed successfully" });
    } catch (error) {
      next(error);
    }
  }
}
