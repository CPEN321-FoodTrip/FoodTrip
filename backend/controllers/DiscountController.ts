import { NextFunction, Request, Response } from "express";
import {
  addDiscountToDb,
  deleteDiscountFromDb,
  getAllDiscountsFromDb,
  getDiscountsFromDb,
} from "../helpers/DiscountHelper";
import { ObjectId } from "mongodb";
import { Discount } from "../interfaces/DiscountInterfaces";
import { getAllTokensFromDb } from "../helpers/NotificationHelper";
import * as admin from "firebase-admin";

export class DiscountController {
  // add a new discount
  // POST /discounts
  addDiscount = async(req: Request, res: Response, next: NextFunction) => {
    // validation of params performed by express-validator middleware
    const { storeID, storeName, ingredient, price } = req.body;

    const discount: Discount = {
      storeID,
      storeName,
      ingredient,
      price,
    };

    try {
      const discountID = await addDiscountToDb(discount);

      const tokens = await getAllTokensFromDb();
      const payload = {
        notification: {
          title: "New Discount Available!",
          body: `Get ${discount.ingredient} for only $${discount.price}% at ${discount.storeName}!`,
        },
      };

      // send notification using firebase
      if (tokens.length !== 0) {
        const response = await admin
          .messaging()
          .sendEachForMulticast({ tokens, notification: payload.notification });
        if (response.failureCount > 0) {
          console.error("Failed to send notifications to some devices");
        }
      }

      res
        .status(201)
        .json({ message: "Discount created successfully", discountID });
    } catch (error) {
      next(error);
    }
  }

  // get discounts for a store
  // GET /discounts/:id
  getDiscounts = async(req: Request, res: Response, next: NextFunction) => {
    try {
      // storeID validation is performed by express-validator middleware
      const storeID = req.params.id;

      const discounts = await getDiscountsFromDb(storeID);

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
  getAllDiscounts = async(req: Request, res: Response, next: NextFunction) => {
    try {
      const ingredient = (req.query.ingredient as string) || "";

      const discounts = await getAllDiscountsFromDb(ingredient);

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
  deleteDiscount = async(req: Request, res: Response, next: NextFunction) => {
    try {
      const discountID = req.params.id;

      if (!ObjectId.isValid(discountID)) {
        return res.status(400).json({ error: "Invalid discountID format" });
      }

      const result = await deleteDiscountFromDb(discountID);

      if (!result) {
        return res.status(404).json({ error: "Discount not found" });
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
