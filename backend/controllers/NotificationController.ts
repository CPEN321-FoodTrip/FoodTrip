import { NextFunction, Request, Response } from "express";
import { UserNotificationData } from "../interfaces/NotificationInterfaces";

export class NotificationController {
  async subscribe(req: Request, res: Response, next: NextFunction) {
    // validation of params performed by express-validator middleware
    const { userId, fcmToken }: UserNotificationData = req.body;

    try {
      // TODO: store token in db
      res.status(201).send("Subscribed successfully");
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction) {
    // validation of param performed by express-validator middleware
    const { userId } = req.body;

    try {
      // TODO: remove token from db
      res.status(201).send("Unsubscribed successfully");
    } catch (error) {
      next(error);
    }
  }
}
