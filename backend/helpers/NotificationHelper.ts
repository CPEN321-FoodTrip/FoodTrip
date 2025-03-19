import { UserNotificationData } from "../interfaces/NotificationInterfaces";
import { client } from "../services";

const DB_NAME = "discounts";
const COLLECTION_NAME = "notifications";

// add user fcm token to database
export async function addTokenToDb(
  userID: string,
  fcmToken: string
): Promise<void> {
  await client
    .db(DB_NAME)
    .collection<UserNotificationData>(COLLECTION_NAME)
    .insertOne({ userID, fcmToken });
}

// remove user fcm token from database
export async function removeTokenFromDb(userID: string): Promise<number> {
  const deletedCount: number = (
    await client
      .db(DB_NAME)
      .collection<UserNotificationData>(COLLECTION_NAME)
      .deleteOne({ userID })
  ).deletedCount;

  return deletedCount;
}

// get user fcm token from database
export async function getTokenFromDb(userID: string): Promise<string | null> {
  const result: UserNotificationData | null = await client
    .db(DB_NAME)
    .collection<UserNotificationData>(COLLECTION_NAME)
    .findOne({ userID });

  return result ? result.fcmToken : null;
}

// get all fcm tokens from database
export async function getAllTokensFromDb(): Promise<string[]> {
  const result: UserNotificationData[] = await client
    .db(DB_NAME)
    .collection<UserNotificationData>(COLLECTION_NAME)
    .find({})
    .toArray();

  return result.map((result) => result.fcmToken);
}
