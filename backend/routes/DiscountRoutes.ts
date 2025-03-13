import { body } from "express-validator";
import { DiscountController } from "../controllers/DiscountController";

const controller = new DiscountController();

export const DiscountRoutes = [
  {
    method: "post",
    route: "/discounts",
    action: controller.addDiscount,
    validation: [
      body("storeID").exists().isString(),
      body("storeName").exists().isString(),
      body("ingredient").exists().isString(),
      body("price").exists().isNumeric(),
    ],
  },
  {
    method: "get",
    route: "/discount/:id",
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
