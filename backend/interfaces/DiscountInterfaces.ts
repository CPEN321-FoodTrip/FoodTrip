import { ObjectId } from "mongodb";

export interface Discount {
  storeID: string;
  storeName: string;
  ingredient: string;
  price: number;
}

export interface DiscountWithID extends Discount {
  discountID: string;
}

export interface DiscountDBEntry extends Discount {
  _id: ObjectId;
}
