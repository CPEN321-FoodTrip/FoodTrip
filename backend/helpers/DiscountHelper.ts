import { ObjectId } from "mongodb";
import { client } from "../services";

const DB_NAME = "discounts";
const COLLECTION_NAME = "discounts";

export interface Discount {
  storeID: string;
  groceryStore: string;
  ingredient: string;
  price: number;
}

export async function getDiscountsFromDatabase(storeID: string): Promise<{}> {
  const discounts = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .find({ storeID: storeID })
    .toArray();

  return discounts;
}

export async function addDiscountToDatabase(
  discount: Discount
): Promise<string> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .insertOne(discount);

  return result.insertedId.toString();
}

export async function deleteDiscountFromDatabase(
  discountID: string
): Promise<{}> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(discountID) });

  return result.deletedCount;
}

export async function getAllDiscountsFromDatabase(): Promise<{}> {
  const discounts = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .find({})
    .toArray();

  return discounts;
}
