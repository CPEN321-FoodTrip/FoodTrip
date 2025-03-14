import { body } from "express-validator";

export const NotificationRoutes = [
  {
    method: "post",
    route: "/notification/subscribe",
    action: "subscribe",
    validation: [
      body("userId")
        .exists()
        .isString()
        .withMessage("userId is required and must be a string"),
      body("fcmToken")
        .exists()
        .isString()
        .withMessage("fcmToken is required and must be a string"),
    ],
  },
  {
    method: "post",
    route: "/notification/unsubscribe",
    action: "unsubscribe",
    validation: [
      body("userId")
        .exists()
        .isString()
        .withMessage("userId is required and must be a string"),
    ],
  },
];
