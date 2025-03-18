import { NextFunction, Request, Response } from "express";
import { UserNotificationData } from "../interfaces/NotificationInterfaces";
import {
  addTokenToDb,
  getTokenFromDb,
  removeTokenFromDb,
} from "../helpers/NotificationHelper";

// POST /notifications
export const subscribe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // validation of params performed by express-validator middleware
    const { userID, fcmToken }: UserNotificationData = req.body;

    const prevToken = await getTokenFromDb(userID);
    if (prevToken) {
      return res.status(400).json({ error: "Already subscribed" });
    }

    await addTokenToDb(userID, fcmToken);

    res.status(201).json({ message: "Subscribed successfully" });
  } catch (error) {
    next(error);
  }
};

// DELETE /notifications/:id
export const unsubscribe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
};
