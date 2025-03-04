import { ObjectId } from "mongodb";
import { client } from "../services";

const DB_NAME = "discounts";
const COLLECTION_NAME = "discounts";

export interface Discount {
  storeID: string;
  groceryStore: string; // store name
  ingredient: string;
  price: number;
}

// get all discounts for a store
export async function getDiscountsFromDatabase(storeID: string): Promise<{}> {
  const discounts = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .find({ storeID: storeID })
    .toArray();

  return discounts.map(({ _id, ...rest }) => ({ discountID: _id, ...rest }));
}

// add a discount to the database
export async function addDiscountToDatabase(
  discount: Discount
): Promise<string> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .insertOne(discount);

  return result.insertedId.toString();
}

// delete a discount from the database
export async function deleteDiscountFromDatabase(
  discountID: string
): Promise<{}> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(discountID) });

  return result.deletedCount;
}

// get all discounts from the database
export async function getAllDiscountsFromDatabase(): Promise<{}> {
  const discounts = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .find({})
    .toArray();

  return discounts.map(({ _id, ...rest }) => ({ discountID: _id, ...rest }));
}
