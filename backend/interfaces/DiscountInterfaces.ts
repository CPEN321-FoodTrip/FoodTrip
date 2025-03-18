import { ObjectId } from "mongodb";

export interface Discount {
  storeID: string;
  storeName: string;
  ingredient: string;
  price: number;
  discountID?: string;
  _id?: ObjectId;
}
