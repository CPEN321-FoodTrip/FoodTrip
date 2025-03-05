import { NextFunction, Request, Response } from "express";
import {
  addDiscountToDatabase,
  deleteDiscountFromDatabase,
  Discount,
  getAllDiscountsFromDatabase,
  getDiscountsFromDatabase,
} from "../helpers/DiscountHelper";

export class DiscountController {
  // store can access all its discounts
  async getDiscounts(req: Request, res: Response, next: NextFunction) {
    const storeID = req.query.storeID as string;

    if (!storeID) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    const discounts = await getDiscountsFromDatabase(storeID);
    res.json(discounts);
  }

  // store can add a discount
  async addDiscount(req: Request, res: Response, next: NextFunction) {
    const discount = req.body as Discount;

    if (!discount) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    const discountID = await addDiscountToDatabase(discount);
    res.json({ discountID: discountID });
  }

  // store can delete a discount
  async deleteDiscount(req: Request, res: Response, next: NextFunction) {
    const discountID = req.query.discountID as string;

    if (!discountID) {
      res.status(400).json({ error: "Invalid request parameters" });
      return;
    }

    const result = await deleteDiscountFromDatabase(discountID);
    if (!result) {
      res.status(404).json({ error: "Discount not found" });
      return;
    }

    res.json({ success: true });
  }

  // for users, access all discounts, with optional ingredient filter
  async getAllDiscounts(req: Request, res: Response, next: NextFunction) {
    const ingredient = (req.query.ingredient as string) || "";

    const discounts = await getAllDiscountsFromDatabase(ingredient);
    res.json(discounts);
  }
}
