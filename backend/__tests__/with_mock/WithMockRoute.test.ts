import request from "supertest";
import app from "../../index";
import * as RouteHelpers from "../../helpers/RouteHelpers";
import { ObjectId } from "mongodb";

jest.mock("node-fetch", () => jest.fn());

describe("Mocked: POST /routes", () => {
  beforeAll(async () => {
    await RouteHelpers.initializeGeoNamesDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Input: user id, origin, destination, numStops all valid
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Fail external api request", async () => {
    // dont mock coordinates from openstreetmap api call, cause it to fail
    global.fetch = jest.fn();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
  });

  // Input: user id, origin, destination, numStops all valid and valid coordinates for first city
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Fail external api on second request", async () => {
    // dont mock second coordinates from openstreetmap api call, cause it to fail
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "49.2827", lon: "-123.1207" }],
      }); // no toronto

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
  });

  // Input: user id, origin, destination, numStops all valid and valid coordinates for both cities
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Insert database failure", async () => {
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "49.2827", lon: "-123.1207" }],
      })
      // toronto
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "43.6532", lon: "-79.3832" }],
      });

    // database failure
    jest.spyOn(RouteHelpers, "saveRouteToDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(RouteHelpers.saveRouteToDb).toHaveBeenCalled();
  });
});

describe("Mocked: GET /routes/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Input: valid trip id
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database connection failure", async () => {
    const tripID = new ObjectId(123);
    jest.spyOn(RouteHelpers, "getRouteFromDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .get(`/routes/${tripID.toHexString()}`)
      .expect(500);
    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(RouteHelpers.getRouteFromDb).toHaveBeenCalled();
  });

  // Input: valid trip id
  // Expected status code: 404
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Empty database", async () => {
    const tripID = new ObjectId(123);
    jest.spyOn(RouteHelpers, "getRouteFromDb").mockResolvedValueOnce(null);

    const response = await request(app)
      .get(`/routes/${tripID.toHexString()}`)
      .expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");
    expect(RouteHelpers.getRouteFromDb).toHaveBeenCalled();
  });
});

describe("Mocked: DELETE /routes/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Input: valid trip id
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database connection failure", async () => {
    const tripID = new ObjectId(123);
    jest.spyOn(RouteHelpers, "deleteRouteFromDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .delete(`/routes/${tripID.toHexString()}`)
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(RouteHelpers.deleteRouteFromDb).toHaveBeenCalled();
  });

  // Input: valid trip id
  // Expected status code: 404
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Empty database", async () => {
    const tripID = new ObjectId(123);
    jest.spyOn(RouteHelpers, "deleteRouteFromDb").mockResolvedValueOnce(0);

    const response = await request(app)
      .delete(`/routes/${tripID.toHexString()}`)
      .expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");
    expect(RouteHelpers.deleteRouteFromDb).toHaveBeenCalled();
  });
});
