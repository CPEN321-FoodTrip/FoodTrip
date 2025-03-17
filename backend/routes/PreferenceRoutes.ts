import { body } from "express-validator";
import { addAllergy, deleteAllergy, getAllergies } from "../controllers/PreferenceController";

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
    action: addAllergy,
  },
  {
    method: "get",
    route: "/preferences/allergies/:id",
    action: getAllergies,
  },
  {
    method: "delete",
    route: "/preferences/allergies/:id/:allergy",
    action: deleteAllergy,
  },
];
