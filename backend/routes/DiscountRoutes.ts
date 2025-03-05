import { body } from "express-validator";
import { DiscountController } from "../controllers/DiscountController";

const controller = new DiscountController();

export const DiscountRoutes = [
  {
    method: "get",
    route: "/discount",
    action: controller.getDiscounts,
    validation: [],
  },
  {
    method: "post",
    route: "/discount",
    action: controller.addDiscount,
    validation: [
      body("storeID").exists().isString(),
      body("storeName").exists().isString(),
      body("ingredient").exists().isString(),
      body("price").exists().isNumeric(),
    ],
  },
  {
    method: "delete",
    route: "/discount",
    action: controller.deleteDiscount,
    validation: [],
  },
  {
    method: "get",
    route: "/discount/all",
    action: controller.getAllDiscounts,
    validation: [],
  },
];
