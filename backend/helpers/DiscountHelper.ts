import { ObjectId } from "mongodb";
import { client } from "../services";
import { Discount } from "../interfaces/DiscountInterfaces";

const DB_NAME = "discounts";
const COLLECTION_NAME = "discounts";

// add a discount to the database
export async function addDiscountToDb(discount: Discount): Promise<string> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .insertOne(discount);

  return result.insertedId.toString();
}

// get all discounts for a store
export async function getDiscountsFromDb(storeID: string): Promise<{}> {
  const discounts = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .find({ storeID: storeID })
    .toArray();

  return discounts.map(({ _id, ...rest }) => ({ discountID: _id, ...rest }));
}

// get all discounts from the database, with optional ingredient filter
export async function getAllDiscountsFromDb(
  ingredient: string = ""
): Promise<{}> {
  const query = ingredient ? { ingredient: ingredient } : {};

  const discounts = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .find(query)
    .toArray();

  return discounts.map(({ _id, ...rest }) => ({ discountID: _id, ...rest }));
}

// delete a discount from the database
export async function deleteDiscountFromDb(
  discountID: string
): Promise<number> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(discountID) });

  return result.deletedCount;
}
