import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { initializeClient } from "./services";

let mongoServer: MongoMemoryServer;
let client: MongoClient;

const testDbs = ["recipes", "route_data", "discounts"];

// suppress console logs in tests to avoid clutter
jest.spyOn(console, "log").mockImplementation(() => {});

beforeAll(async () => {
  // start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  client = new MongoClient(uri);
  await client.connect();
  initializeClient(client); // inject test client
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

export { client };
