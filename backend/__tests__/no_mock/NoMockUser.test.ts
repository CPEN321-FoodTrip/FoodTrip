import request from "supertest";
import app from "../../index";
import { client } from "../../services";
import { Route } from "../../interfaces/RouteInterfaces";

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

// Interface GET /users/:id/routes
describe("Unmocked: GET /users/:id/routes", () => {
  const SAMPLE_ROUTE1 = {
    start_location: {
      name: "Vancouver",
      latitude: 49.2608724,
      longitude: -123.113952,
      population: 675218,
    },
    end_location: {
      name: "Ottawa",
      latitude: 45.4208777,
      longitude: -75.6901106,
      population: 1013247,
    },
    stops: [],
  };
  const SAMPLE_ROUTE2 = {
    start_location: {
      name: "Istanbul",
      latitude: 41.006381,
      longitude: 28.9758715,
      population: 15462452,
    },
    end_location: {
      name: "Prague",
      latitude: 50.0874654,
      longitude: 14.4212535,
      population: 1301132,
    },
    stops: [],
  };

  // Input: SAMPLE_ROUTE1 and SAMPLE_ROUTE2 are valid routes saved in the db
  // Expected status code: 200
  // Expected behavior: all routes are retrieved from the db
  // Expected output: an array of routes
  test("Valid user with routes", async () => {
    // setup: insert sample routes into db
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection<{ userID: string; route: Route }>(
      ROUTES_COLLECTION_NAME
    );
    const restult = await collection.insertMany([
      { userID: "test-user", route: SAMPLE_ROUTE1 },
      { userID: "test-user", route: SAMPLE_ROUTE2 },
    ]);
    const tripID1 = restult.insertedIds[0];
    const tripID2 = restult.insertedIds[1];

    const userID = "test-user";
    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tripID: tripID1.toHexString(),
          ...SAMPLE_ROUTE1,
        }),
        expect.objectContaining({
          tripID: tripID2.toHexString(),
          ...SAMPLE_ROUTE2,
        }),
      ])
    );

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input: userID is valid but no routes are saved in the db
  // Expected status code: 200
  // Expected behavior: no routes are retrieved from the db
  // Expected output: an empty array
  test("User with no routes", async () => {
    const userID = "nonexistent-user";
    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  // Input: none
  // Expected status code: 404
  // Expected behavior: no routes are retrieved from the db
  // Expected output: an empty object
  test("Missing userID", async () => {
    const response = await request(app).get("/users//routes").expect(404); // malformed url
    expect(response.body).toMatchObject({});
  });

  // Input: userID is empty
  // Expected status code: 400
  // Expected behavior: no routes are retrieved from the db
  // Expected output: an error message indicating that userID is required
  test("Invalid userID format", async () => {
    const userID = " "; // empty
    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(400);

    expect(response.body).toHaveProperty("error", "userID is required");
  });
});
