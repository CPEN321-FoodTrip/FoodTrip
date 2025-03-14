import request from "supertest";
import app from "../../index";
import { client } from "../../services";
import { ObjectId } from "mongodb";

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

describe("Unmocked: GET /users/:id/routes", () => {
  const SAMPLE_ROUTE1 = {
    userID: "test-user",
    start_location: {
      name: "Vancouver",
      latitude: 49.2608724,
      longitude: -123.113952,
    },
    end_location: {
      name: "Ottawa",
      latitude: 45.4208777,
      longitude: -75.6901106,
    },
    _id: new ObjectId(),
  };
  const SAMPLE_ROUTE2 = {
    userID: "test-user",
    start_location: {
      name: "Istanbul",
      latitude: 41.006381,
      longitude: 28.9758715,
    },
    end_location: {
      name: "Prague",
      latitude: 50.0874654,
      longitude: 14.4212535,
    },
    _id: new ObjectId(),
  };

  // Input: SAMPLE_ROUTE1 and SAMPLE_ROUTE2 are valid routes saved in the db
  // Expected status code: 200
  // Expected behavior: all routes are retrieved from the db
  // Expected output: an array of routes
  test("Valid user with routes", async () => {
    // setup: insert sample routes into db
    const db = client.db(ROUTES_DB_NAME);
    const collection = db.collection(ROUTES_COLLECTION_NAME);
    await collection.insertMany([SAMPLE_ROUTE1, SAMPLE_ROUTE2]);

    const userID = "test-user";
    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const { _id: _id1, ...routeWithoutId1 } = SAMPLE_ROUTE1;
    const { _id: _id2, ...routeWithoutId2 } = SAMPLE_ROUTE2;
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ...routeWithoutId1,
          tripID: _id1.toHexString(),
        }),
        expect.objectContaining({
          ...routeWithoutId2,
          tripID: _id2.toHexString(),
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
