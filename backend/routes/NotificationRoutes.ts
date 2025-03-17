import { body } from "express-validator";
import { subscribe, unsubscribe } from "../controllers/NotificationController";

export const NotificationRoutes = [
  {
    method: "post",
    route: "/notifications",
    action: subscribe,
    validation: [
      body("userID")
        .exists()
        .isString()
        .withMessage("userID is required and must be a string"),
      body("fcmToken")
        .exists()
        .isString()
        .withMessage("fcmToken is required and must be a string"),
    ],
  },
  {
    method: "delete",
    route: "/notifications/:id",
    action: unsubscribe,
    validation: [],
  },
];
