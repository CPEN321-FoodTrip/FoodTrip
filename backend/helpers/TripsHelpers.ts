import { client } from "../services";

const DB_NAME = "trip_data";
const TRIP_COLLECTION = "trips";

// store single trip data
export async function storeTripData(
  userID: string,
  route: {},
  recipes: {}
): Promise<void> {
  const db = client.db(DB_NAME);
  const collection = db.collection(TRIP_COLLECTION);

  const trip = {
    userID,
    route,
    recipes,
  };

  await collection.insertOne(trip);
}

// get all trips data for a user
export async function getTripsData(userID: string) {
  const db = client.db(DB_NAME);
  const collection = db.collection(TRIP_COLLECTION);

  const trips = await collection.find({ userID: userID }).toArray();

  return trips;
}
