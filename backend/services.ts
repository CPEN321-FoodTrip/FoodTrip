import { MongoClient } from "mongodb";

export let client: MongoClient;

export function initializeClient(customClient?: MongoClient) {
  if (customClient) {
    client = customClient;
  } else {
    client = new MongoClient(process.env.DB_URI ?? "mongodb://localhost:27017");
  }
}
