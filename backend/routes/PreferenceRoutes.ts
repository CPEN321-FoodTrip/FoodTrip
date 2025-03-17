import { body } from "express-validator";
import { PreferenceController } from "../controllers/PreferenceController";

const controller = new PreferenceController();

export const PreferenceRoutes = [
  {
    method: "post",
    route: "/preferences/allergies",
    validation: [
      body("userID")
        .exists()
        .isString()
        .withMessage("userID is required and must be a string"),
      body("allergy")
        .exists()
        .isString()
        .withMessage("allergy is required and must be a string"),
    ],
    action: controller.addAllergy,
  },
  {
    method: "get",
    route: "/preferences/allergies/:id",
    action: controller.getAllergies,
  },
  {
    method: "delete",
    route: "/preferences/allergies/:id/:allergy",
    action: controller.deleteAllergy,
  },
];
