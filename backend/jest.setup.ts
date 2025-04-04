import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { initializeClient, initializeFirebaseAdmin } from "./services";
import dotenv from "dotenv";

dotenv.config();

let mongoServer: MongoMemoryServer;
let client: MongoClient;

const testDbs = ["recipes", "route_data", "discounts", "preferences"];

beforeAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
  // start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  client = new MongoClient(uri);
  await client.connect();
  initializeClient(client); // inject test client

  initializeFirebaseAdmin();
}, 30000); // 30 second timeout for starting MongoDB

afterEach(async () => {
  // clear clear collections from dbs
  for (const dbName of testDbs) {
    const database = client.db(dbName);
    const collections = await database.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  await client.close();
  await mongoServer.stop();
});
