import { client } from "../services";

const DB_NAME = "discounts";
const COLLECTION_NAME = "discounts";

interface Discount {
  groceryStore: string;
  ingredient: string;
  price: number;
}

export class DiscountHelper {
  public static async getDiscounts() {
    const db = client.db(DB_NAME);
    return await db.collection(COLLECTION_NAME).find().toArray();
  }

  public static async storeDiscount(discount: Discount) {
    const db = client.db(DB_NAME);
    return await db.collection(COLLECTION_NAME).insertOne(discount);
  }
}
