import { body } from "express-validator";
import { DiscountController, addDiscount } from "../controllers/DiscountController";

const controller = new DiscountController();

export const DiscountRoutes = [
  {
    method: "post",
    route: "/discounts",
    action: addDiscount,
    validation: [
      body("storeID")
        .exists()
        .isString()
        .withMessage("storeID is required and must be a string"),
      body("storeName")
        .exists()
        .isString()
        .withMessage("storeName is required and must be a string"),
      body("ingredient")
        .exists()
        .isString()
        .withMessage("ingredient is required and must be a string"),
      body("price")
        .exists()
        .isNumeric()
        .withMessage("price is required and must be a number"),
    ],
  },
  {
    method: "get",
    route: "/discounts/:id",
    action: controller.getDiscounts,
    validation: [],
  },
  {
    method: "get",
    route: "/discounts",
    action: controller.getAllDiscounts,
    validation: [],
  },
  {
    method: "delete",
    route: "/discounts/:id",
    action: controller.deleteDiscount,
    validation: [],
  },
];
