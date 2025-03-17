import { Allergy } from "../interfaces/PreferenceInterfaces";
import { client } from "../services";
import { Document } from "bson";

const DB_NAME = "preferences";
const COLLECTION_NAME = "allergies";

// add new allergy to the database
export async function addAllergyToDb(
  userID: string,
  allergy: string
): Promise<void> {
  const db = client.db(DB_NAME);
  const collection = db.collection<Allergy>(COLLECTION_NAME);

  await collection.insertOne({ userID, allergy });
}

// retrieve all allergies for a user
export async function getAllergiesFromDb(userID: string): Promise<Allergy[]> {
  const db = client.db(DB_NAME);
  const collection = db.collection<Allergy>(COLLECTION_NAME);

  const allergies: Allergy[] = await collection.find({ userID }).toArray();
  return allergies;
}

// delete an allergy for a user
export async function deleteAllergyFromDb(
  userID: string,
  allergy: string
): Promise<number> {
  const db = client.db(DB_NAME);
  const collection = db.collection<Allergy>(COLLECTION_NAME);
  const deleteCount: number = (await collection.deleteOne({ userID, allergy }))
    .deletedCount;
  return deleteCount;
}
