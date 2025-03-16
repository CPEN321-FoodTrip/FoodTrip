import { client } from "../services";

const DB_NAME = "preferences";
const COLLECTION_NAME = "allergies";

import { ObjectId } from "mongodb";

// add new allergy to the database
export async function addAllergyToDb(
  userID: string,
  allergy: string
): Promise<ObjectId> {
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  return (await collection.insertOne({ userID, allergy })).insertedId;
}

// retrieve all allergies for a user
export async function getAllergiesFromDb(userID: string): Promise<any[]> {
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  return collection.find({ userID }).toArray();
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
