import request from "supertest";
import app from "../../index";
import { initializeGeoNamesDatabase } from "../../helpers/RouteHelpers";
import { client } from "../../services";
import { ObjectId } from "mongodb";

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

const SAMPLE_ROUTE = {
  start_location: {
    name: "Vancouver",
    latitude: 49.2608724,
    longitude: -123.113952,
  },
  end_location: {
    name: "Toronto",
    latitude: 43.6534817,
    longitude: -79.3839347,
  },
  stops: [
    {
      location: {
        name: "Regina",
        latitude: 50.45008,
        longitude: -104.6178,
        population: 176183,
      },
      distanceFromStart: 1329.071074459746,
      cumulativeDistance: 1329.071074459746,
      segmentPercentage: 33.33333333333333,
    },
    {
      location: {
        name: "Minneapolis",
        latitude: 44.97997,
        longitude: -93.26384,
        population: 410939,
      },
      distanceFromStart: 2292.312851021066,
      cumulativeDistance: 2292.312851021066,
      segmentPercentage: 66.66666666666666,
    },
  ],
};

describe("Unmocked: POST /routes", () => {
  beforeAll(async () => {
    await initializeGeoNamesDatabase();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Succesful route generated", async () => {
    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(200);

    // response verification
    expect(response.body).toHaveProperty("tripID");
    expect(response.body).toHaveProperty("start_location");
    expect(response.body).toHaveProperty("end_location");
    expect(Array.isArray(response.body.stops)).toBe(true);
    expect(response.body.stops).toHaveLength(1); // 1 stop

    // db verification
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection(ROUTES_COLLECTION_NAME);
    const tripID = response.body.tripID;
    const result = await collection.findOne({ _id: new ObjectId(tripID) });

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("userID", "test-user");
    expect(result!.start_location).toHaveProperty("name", "Vancouver");
    expect(result!.end_location).toHaveProperty("name", "Toronto");
    expect(Array.isArray(result!.stops)).toBe(true);
    expect(result!.stops).toHaveLength(1); // 1 stop
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Missing body parameters", async () => {
    const dbCountBefore = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app).post("/routes").send({}).expect(400);
    // error should mention parameters missing
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("userID")
      )
    ).toBe(true);
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("origin")
      )
    ).toBe(true);
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("destination")
      )
    ).toBe(true);
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("numStops")
      )
    ).toBe(true);

    // verify db unchaged
    const dbCountAfter = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Nonexistant origin city", async () => {
    const dbCountBefore = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "InvalidCity",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Origin"); // error should mention origin

    // verfify db unchaged
    const dbCountAfter = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Nonexistant destination city", async () => {
    const dbCountBefore = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "InvalidCity",
        numStops: 1,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Destination"); // error should mention destination

    // verify db unchaged
    const dbCountAfter = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Invalid string value for stops", async () => {
    const dbCountBefore = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: "invalid",
      })
      .expect(400);

    expect(response.body).toHaveProperty("errors");
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("must be an integer")
      )
    ).toBe(true);

    // verify db unchaged
    const dbCountAfter = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Negative number of stops", async () => {
    const dbCountBefore = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: -1,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Number of stops must be at least");

    // verify db unchaged
    const dbCountAfter = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Too high number of stops", async () => {
    const dbCountBefore = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 999999999999999,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Number of stops must be at most");

    // verify db unchaged
    const dbCountAfter = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Check same origin and destination city", async () => {
    const dbCountBefore = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Vancouver",
        numStops: 3,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain(
      "Same start and end city not allowed"
    );

    // verify db unchaged
    const dbCountAfter = await client
      .db(ROUTES_DB_NAME)
      .collection(ROUTES_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });
});

describe("Unmocked: GET /routes/:id", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Retreive valid route", async () => {
    // setup: inset sample route into db
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection(ROUTES_COLLECTION_NAME);
    const result = await collection.insertOne(SAMPLE_ROUTE);
    const tripID = result.insertedId;

    const response = await request(app).get(`/routes/${tripID}`).expect(200);

    expect(response.body).toHaveProperty(
      "start_location",
      SAMPLE_ROUTE.start_location
    );
    expect(response.body).toHaveProperty(
      "end_location",
      SAMPLE_ROUTE.end_location
    );
    expect(response.body).toHaveProperty("stops", SAMPLE_ROUTE.stops);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Missing tripID", async () => {
    const response = await request(app).get("/routes/").expect(400);
    expect(response.body).toHaveProperty("error", "tripID is required");
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Invalid tripID format", async () => {
    const tripID = "1234"; // tripID should be a valid ObjectId
    const response = await request(app).get(`/routes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Route not found (Empty db)", async () => {
    const tripID = new ObjectId().toHexString(); // nonexistant tripID
    const response = await request(app).get(`/routes/${tripID}`).expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");
  });
});

describe("Unmocked: DELETE /routes/:id", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid deletion", async () => {
    // setup: insert sample route
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection(ROUTES_COLLECTION_NAME);
    const result = await collection.insertOne(SAMPLE_ROUTE);
    const tripID = result.insertedId;
    const originalCount = await collection.countDocuments();

    const response = await request(app).delete(`/routes/${tripID}`).expect(200);
    expect(response.body).toHaveProperty("success", true);

    // check db for deletion
    const findResult = await collection.findOne({ _id: new ObjectId(tripID) });
    expect(findResult).toBeNull();
    const newCount = await collection.countDocuments();
    expect(newCount).toBe(originalCount - 1);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Missing tripID", async () => {
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection(ROUTES_COLLECTION_NAME);
    const originalCount = await collection.countDocuments();

    const response = await request(app).delete("/routes/").expect(400);
    expect(response.body).toHaveProperty("error", "tripID is required");

    // verify nothing deleted in db
    const newCount = await collection.countDocuments();
    expect(newCount).toBe(originalCount);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Invalid tripID format", async () => {
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection(ROUTES_COLLECTION_NAME);
    const originalCount = await collection.countDocuments();

    const tripID = "1234"; // tripID should be a valid ObjectId
    const response = await request(app).delete(`/routes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");

    // verify nothing deleted in db
    const newCount = await collection.countDocuments();
    expect(newCount).toBe(originalCount);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Delete nonexistant route", async () => {
    // setup: insert sample route
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection(ROUTES_COLLECTION_NAME);
    const result = await collection.insertOne(SAMPLE_ROUTE);
    const tripID = result.insertedId;
    const originalCount = await collection.countDocuments();

    const fakeTripID = new ObjectId().toHexString(); // nonexistant tripID
    const response = await request(app)
      .delete(`/routes/${fakeTripID}`)
      .expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");

    // check db to make sure nothing was deleted
    const findResult = await collection.findOne({ _id: new ObjectId(tripID) });
    expect(findResult).not.toBeNull();
    const newCount = await collection.countDocuments();
    expect(newCount).toBe(originalCount);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Delete on empty db", async () => {
    // no setup, no routes in db

    const tripID = new ObjectId().toHexString(); // nonexistant tripID
    const response = await request(app).delete(`/routes/${tripID}`).expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");

    // check db to make sure nothing was deleted
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection(ROUTES_COLLECTION_NAME);
    const findResult = await collection.findOne({ _id: new ObjectId(tripID) });
    expect(findResult).toBeNull();
    const count = await collection.countDocuments();
    expect(count).toBe(0);
  });
});
