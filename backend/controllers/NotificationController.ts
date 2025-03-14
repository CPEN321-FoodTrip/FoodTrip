import { NextFunction, Request, Response } from "express";
import { UserNotificationData } from "../interfaces/NotificationInterfaces";
import {
  addTokenToDb,
  getTokenFromDb,
  removeTokenFromDb,
} from "../helpers/NotificationHelper";

export class NotificationController {
  async subscribe(req: Request, res: Response, next: NextFunction) {
    // validation of params performed by express-validator middleware
    const { userId, fcmToken }: UserNotificationData = req.body;

    try {
      const prevToken = await getTokenFromDb(userId);
      if (prevToken) {
        return res.status(400).send("Already subscribed");
      }

      const result = await addTokenToDb(userId, fcmToken);
      if (!result) {
        throw new Error("Failed to subscribe");
      }

      res.status(201).send("Subscribed successfully");
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction) {
    // validation of param performed by express-validator middleware
    const { userId } = req.body;

    try {
      const result = await removeTokenFromDb(userId);
      if (!result) {
        return res.status(400).send("Not subscribed");
      }

      res.status(201).send("Unsubscribed successfully");
    } catch (error) {
      next(error);
    }
  }
}
