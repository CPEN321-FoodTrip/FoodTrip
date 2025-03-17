import { client } from "../services";

const DB_NAME = "preferences";
const COLLECTION_NAME = "allergies";

// add new allergy to the database
export async function addAllergyToDb(
  userID: string,
  allergy: string
): Promise<void> {
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  await collection.insertOne({ userID, allergy });
}

// retrieve all allergies for a user
export async function getAllergiesFromDb(userID: string): Promise<any[]> {
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  return await collection
    .find({ userID })
    .project({ allergy: 1, _id: 0 })
    .toArray();
}

// delete an allergy for a user
export async function deleteAllergyFromDb(
  userID: string,
  allergy: string
): Promise<number> {
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  return (await collection.deleteOne({ userID, allergy })).deletedCount;
}
