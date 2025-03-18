import { ObjectId } from "mongodb";
import { client } from "../services";
import {
  Discount,
  DiscountDBEntry,
  DiscountWithID,
} from "../interfaces/DiscountInterfaces";

const DB_NAME = "discounts";
const COLLECTION_NAME = "discounts";

// add a discount to the database
export async function addDiscountToDb(discount: Discount): Promise<string> {
  const insertedId: string = (
    await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .insertOne(discount)
  ).insertedId.toHexString();

  return insertedId;
}

// get all discounts for a store
export async function getDiscountsFromDb(
  storeID: string
): Promise<DiscountWithID[]> {
  const discounts: DiscountDBEntry[] = await client
    .db(DB_NAME)
    .collection<DiscountDBEntry>(COLLECTION_NAME)
    .find({ storeID })
    .toArray();

  return discounts.map(({ _id, ...rest }) => ({
    discountID: _id.toHexString(),
    ...rest,
  }));
}

// get all discounts from the database, with optional ingredient filter
export async function getAllDiscountsFromDb(
  ingredient: string
): Promise<DiscountWithID[]> {
  const query = ingredient ? { ingredient } : {};

  const discounts: DiscountDBEntry[] = await client
    .db(DB_NAME)
    .collection<DiscountDBEntry>(COLLECTION_NAME)
    .find(query)
    .toArray();

  return discounts.map(({ _id, ...rest }) => ({
    discountID: _id.toHexString(),
    ...rest,
  }));
}

// delete a discount from the database
export async function deleteDiscountFromDb(
  discountID: string
): Promise<number> {
  const deletedCount: number = (
    await client
      .db(DB_NAME)
      .collection<DiscountDBEntry>(COLLECTION_NAME)
      .deleteOne({ _id: new ObjectId(discountID) })
  ).deletedCount;

  return deletedCount;
}
