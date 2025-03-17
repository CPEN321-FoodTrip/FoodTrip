import { client } from "../services";

const DB_NAME = "discounts";
const COLLECTION_NAME = "notifications";

// add user fcm token to database
export async function addTokenToDb(
  userID: string,
  fcmToken: string
): Promise<string> {
  const insertedId: string = (
    await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .insertOne({ userID, fcmToken })
  ).insertedId.toHexString();

  return insertedId;
}

// remove user fcm token from database
export async function removeTokenFromDb(userID: string): Promise<number> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .deleteOne({ userID });

  return result.deletedCount;
}

// get user fcm token from database
export async function getTokenFromDb(userID: string): Promise<string | null> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .findOne<{ fcmToken: string }>({ userID });

  return result ? result.fcmToken : null;
}

// get all fcm tokens from database
export async function getAllTokensFromDb(): Promise<string[]> {
  const result: { fcmToken: string }[] = await client
    .db(DB_NAME)
    .collection<{ fcmToken: string }>(COLLECTION_NAME)
    .find({})
    .toArray();

  return result.map((result) => result.fcmToken);
}
