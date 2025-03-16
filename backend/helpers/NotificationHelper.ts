import { client } from "../services";

const DB_NAME = "discounts";
const COLLECTION_NAME = "notifications";

// add user fcm token to database
export async function addTokenToDb(
  userID: string,
  fcmToken: string
): Promise<{}> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .insertOne({ userID: userID, fcmToken: fcmToken });

  return result;
}

// remove user fcm token from database
export async function removeTokenFromDb(userID: string): Promise<number> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .deleteOne({ userID: userID });

  return result.deletedCount;
}

// get user fcm token from database
export async function getTokenFromDb(userID: string): Promise<{} | null> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .findOne({ userID: userID });

  return result;
}

// get all fcm tokens from database
export async function getAllTokensFromDb(): Promise<string[]> {
  const result = await client
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .find({})
    .toArray();

  return result.map((result) => result.fcmToken);
}
