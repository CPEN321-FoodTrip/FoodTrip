import { DiscountController } from "../controllers/DiscountController";

const controller = new DiscountController();

export const DiscountRoutes = [
  {
    method: "get",
    route: "/discounts",
    action: controller.getDiscounts,
    validation: [],
  },
  {
    method: "post",
    route: "/discounts",
    action: controller.addDiscount,
    validation: [],
  },
  {
    method: "delete",
    route: "/discounts",
    action: controller.deleteDiscount,
    validation: [],
  },
  {
    method: "get",
    route: "/discounts/all",
    action: controller.getAllDiscounts,
    validation: [],
  },
];
