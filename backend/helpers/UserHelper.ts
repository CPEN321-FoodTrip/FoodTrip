import { RouteDBEntry } from "../interfaces/RouteInterfaces";
import { client } from "../services";

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

// get all routes from MongoDB for user
export async function getUserRoutesFromDb(userID: string): Promise<object[]> {
  const db = client.db(ROUTES_DB_NAME);
  const collection = db.collection<RouteDBEntry>(ROUTES_COLLECTION_NAME);

  const routes: RouteDBEntry[] = await collection.find({ userID }).toArray();

  // add tripID to each route and remove _id and stops
  return routes.map(({ _id, route }) => ({
    tripID: _id?.toHexString() ?? "",
    ...route,
  }));
}
