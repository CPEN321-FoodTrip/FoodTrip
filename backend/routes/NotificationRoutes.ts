import { body } from "express-validator";
import { NotificationController } from "../controllers/NotificationController";

const controller = new NotificationController();

export const NotificationRoutes = [
  {
    method: "post",
    route: "/notifications",
    action: controller.subscribe,
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
    action: controller.unsubscribe,
    validation: [],
  },
];
