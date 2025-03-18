import request from "supertest";
import app from "../../index";
import { initializeGeoNamesDatabase } from "../../helpers/RouteHelpers";
import { client } from "../../services";
import { ObjectId } from "mongodb";
import { Route } from "../../interfaces/RouteInterfaces";

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

const SAMPLE_ROUTE = {
  start_location: {
    name: "Vancouver",
    latitude: 49.2608724,
    longitude: -123.113952,
    population: 631486,
  },
  end_location: {
    name: "Toronto",
    latitude: 43.6534817,
    longitude: -79.3839347,
    population: 2731571,
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

// Interface POST /routes
describe("Unmocked: POST /routes", () => {
  beforeEach(async () => {
    await initializeGeoNamesDatabase();
  }, 30000); // increase timeout for geoNames initialization

  // Input: valid userID, origin, destination and numStops
  // Expected status code: 201
  // Expected behavior: route is successfully generated and saved in db
  // Expected output: route object with tripID, start_location, end_location and stops
  test("Succesful route generated", async () => {
    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(201);

    // response verification
    expect(response.body).toHaveProperty("tripID");
    expect(response.body).toHaveProperty("start_location");
    expect(response.body).toHaveProperty("end_location");
    expect(Array.isArray(response.body.stops)).toBe(true);
    expect(response.body.stops).toHaveLength(1); // 1 stop

    // db verification
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection<{ userID: string; route: Route }>(
      ROUTES_COLLECTION_NAME
    );
    const tripID = response.body.tripID;
    const result = await collection.findOne({ _id: new ObjectId(tripID) });

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("userID", "test-user");
    expect(result?.route.start_location).toHaveProperty("name", "Vancouver");
    expect(result?.route.end_location).toHaveProperty("name", "Toronto");
    expect(Array.isArray(result?.route.stops)).toBe(true);
    expect(result?.route.stops).toHaveLength(1); // 1 stop

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input: missing body parameters
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating missing parameters
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

  // Input: invalid origin city
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating invalid origin city
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

  // Input: invalid destination city
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating invalid destination city
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

  // Input: numStops with invalid string value
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating invalid numStops
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

  // Input: numStops with invalid negative value
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating invalid numStops
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

  // Input: numStops with invalid high value
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating invalid numStops
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

  // Input: same origin and destination city
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating same origin and destination city
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

// Interface GET /routes/:id
describe("Unmocked: GET /routes/:id", () => {
  // Input: SAMPLE_ROUTE is a valid route
  // Expected status code: 200
  // Expected behavior: route is successfully retrieved from db
  // Expected output: route object with start_location, end_location and stops
  test("Retreive valid route", async () => {
    // setup: inset sample route into db
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection<{ userID: string; route: Route }>(
      ROUTES_COLLECTION_NAME
    );
    const result = await collection.insertOne({
      userID: "test-user",
      route: SAMPLE_ROUTE,
    });
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

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input: malformed url without tripID
  // Expected status code: 404
  // Expected behavior: no route is retrieved from db
  // Expected output: empty object
  test("Missing tripID", async () => {
    const response = await request(app).get("/routes/").expect(404); // malformed url
    expect(response.body).toMatchObject({});
  });

  // Input: tripID with invalid format
  // Expected status code: 400
  // Expected behavior: no route is retrieved from db
  // Expected output: error message indicating invalid tripID format
  test("Invalid tripID format", async () => {
    const tripID = "1234"; // tripID should be a valid ObjectId
    const response = await request(app).get(`/routes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");
  });

  // Input: tripID with nonexistant route
  // Expected status code: 404
  // Expected behavior: no route is retrieved from db
  // Expected output: error message indicating route not found
  test("Route not found (Empty db)", async () => {
    const tripID = new ObjectId().toHexString(); // nonexistant tripID
    const response = await request(app).get(`/routes/${tripID}`).expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");
  });
});

// Interface DELETE /routes/:id
describe("Unmocked: DELETE /routes/:id", () => {
  // Input: SAMPLE_ROUTE is a valid route
  // Expected status code: 200
  // Expected behavior: route is successfully deleted from db
  // Expected output: success message
  test("Valid deletion", async () => {
    // setup: insert sample route
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection<{ userID: string; route: Route }>(
      ROUTES_COLLECTION_NAME
    );
    const result = await collection.insertOne({
      userID: "test-user",
      route: SAMPLE_ROUTE,
    });
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

  // Input: malformed url without tripID
  // Expected status code: 404
  // Expected behavior: database is unchanged
  // Expected output: empty object
  test("Missing tripID", async () => {
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection<{ userID: string; route: Route }>(
      ROUTES_COLLECTION_NAME
    );
    const originalCount = await collection.countDocuments();

    const response = await request(app).delete("/routes/").expect(404); // malformed url
    expect(response.body).toMatchObject({});

    // verify nothing deleted in db
    const newCount = await collection.countDocuments();
    expect(newCount).toBe(originalCount);

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input: tripID with invalid format
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating invalid tripID format
  test("Invalid tripID format", async () => {
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection<{ userID: string; route: Route }>(
      ROUTES_COLLECTION_NAME
    );
    const originalCount = await collection.countDocuments();

    const tripID = "1234"; // tripID should be a valid ObjectId
    const response = await request(app).delete(`/routes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");

    // verify nothing deleted in db
    const newCount = await collection.countDocuments();
    expect(newCount).toBe(originalCount);
  });

  // Input: tripID with nonexistant route
  // Expected status code: 404
  // Expected behavior: database is unchanged
  // Expected output: error message indicating route not found
  test("Delete nonexistant route", async () => {
    // setup: insert sample route
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection<{ userID: string; route: Route }>(
      ROUTES_COLLECTION_NAME
    );
    const result = await collection.insertOne({
      userID: "test-user",
      route: SAMPLE_ROUTE,
    });
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

  // Input: empty db and nonexistant tripID
  // Expected status code: 404
  // Expected behavior: database is unchanged
  // Expected output: error message indicating route not found
  test("Delete on empty db", async () => {
    // no setup, no routes in db

    const tripID = new ObjectId().toHexString(); // nonexistant tripID
    const response = await request(app).delete(`/routes/${tripID}`).expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");

    // check db to make sure nothing was deleted
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection<{ userID: string; route: Route }>(
      ROUTES_COLLECTION_NAME
    );
    const findResult = await collection.findOne({ _id: new ObjectId(tripID) });
    expect(findResult).toBeNull();
    const count = await collection.countDocuments();
    expect(count).toBe(0);
  });
});
