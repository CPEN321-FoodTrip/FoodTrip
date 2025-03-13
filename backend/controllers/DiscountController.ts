import { NextFunction, Request, Response } from "express";
import {
  addDiscountToDatabase,
  deleteDiscountFromDatabase,
  Discount,
  getAllDiscountsFromDatabase,
  getDiscountsFromDatabase,
} from "../helpers/DiscountHelper";
import { validationResult } from "express-validator";
import { ObjectId } from "mongodb";

export class DiscountController {
  // add a new discount
  // POST /discounts
  async addDiscount(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { storeID, storeName, ingredient, price } = req.body;

    const discount: Discount = {
      storeID,
      storeName,
      ingredient,
      price,
    };

    try {
      const discountID = await addDiscountToDatabase(discount);

      res
        .status(201)
        .json({ message: "Discount created successfully", discountID });
    } catch (error) {
      next(error);
    }
  }

  // get discounts for a store
  // GET /discounts/:id
  async getDiscounts(req: Request, res: Response, next: NextFunction) {
    try {
      const storeID = req.params.id;

      if (!storeID) {
        return res.status(400).json({ error: "storeID is required" });
      }

      const discounts = await getDiscountsFromDatabase(storeID);

      if (!Array.isArray(discounts) || discounts.length === 0) {
        return res
          .status(404)
          .json({ error: "No discounts found for this store" });
      }

      res.json(discounts);
    } catch (error) {
      next(error);
    }
  }

  // access all discounts
  // GET /discounts
  async getAllDiscounts(req: Request, res: Response, next: NextFunction) {
    try {
      const ingredient = (req.query.ingredient as string) || "";

      const discounts = await getAllDiscountsFromDatabase(ingredient);

      if (!Array.isArray(discounts) || discounts.length === 0) {
        return res.status(404).json({ error: "No discounts found" });
      }

      res.json(discounts);
    } catch (error) {
      next(error);
    }
  }

  // delete a discount
  // DELETE /discounts/:id
  async deleteDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const discountID = req.params.id as string;

      if (!ObjectId.isValid(discountID)) {
        return res.status(400).json({ error: "Invalid discountID format" });
      }

      const result = await deleteDiscountFromDatabase(discountID);

      if (!result) {
        return res.status(404).json({ error: "Discount not found" });
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
