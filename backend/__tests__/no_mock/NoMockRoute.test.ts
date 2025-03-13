import request from "supertest";
import app from "../../index";
import { initializeGeoNamesDatabase } from "../../helpers/RouteHelpers";
import { client } from "../../services";
import { ObjectId } from "mongodb";

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

describe("Unmocked: POST /generate-route", () => {
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
});

describe("Unmocked: GET /get-route", () => {
  let tripID = "";

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid route", async () => {
    const response = await request(app)
      .get("/get-route")
      .query({ tripID })
      .expect(200);

    expect(response.body).toHaveProperty("start_location");
    expect(response.body).toHaveProperty("end_location");
  });

  test("Invalid get deleted route", async () => {
    await request(app).get("/get-route").query({ tripID }).expect(404);
  });
});

describe("Unmocked: GET /get-routes", () => {
  const userID = "test-user";

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid routes", async () => {
    const response = await request(app)
      .get("/get-routes")
      .query({ userID })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("Unmocked: DELETE /delete-route", () => {
  const tripID = "";

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid deletion", async () => {
    const response = await request(app)
      .delete("/delete-route")
      .query({ tripID })
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
  });
});
