import { MongoClient } from "mongodb";

export const client = new MongoClient(
  process.env.DB_URI ?? "mongodb://localhost:27017"
);
