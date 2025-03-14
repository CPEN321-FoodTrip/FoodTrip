import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { initializeClient } from "./services";

let mongoServer: MongoMemoryServer;
let client: MongoClient;

const testDbs = ["recipes", "route_data", "discounts"];

const waitForDbConnection = async () => {
  let connected = false;
  let retries = 5;

  while (!connected && retries > 0) {
    try {
      await client.db("admin").command({ ping: 1 });
      connected = true;
    } catch (error) {
      console.error("Waiting for in-memory DB to be ready...");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 sec before retry
      retries--;
    }
  }

  if (!connected) throw new Error("MongoDB connection failed!");
};

beforeAll(async () => {
  // start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  client = new MongoClient(uri);
  await client.connect();
  initializeClient(client); // inject test client

  await waitForDbConnection();
});

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
