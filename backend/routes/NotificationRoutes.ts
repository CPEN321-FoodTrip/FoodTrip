import { body } from "express-validator";
import { NotificationController } from "../controllers/NotificationController";

const controller = new NotificationController();

export const NotificationRoutes = [
  {
    method: "post",
    route: "/notifications/subscribe",
    action: controller.subscribe,
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
    route: "/notifications/unsubscribe",
    action: controller.unsubscribe,
    validation: [
      body("userId")
        .exists()
        .isString()
        .withMessage("userId is required and must be a string"),
    ],
  },
];
