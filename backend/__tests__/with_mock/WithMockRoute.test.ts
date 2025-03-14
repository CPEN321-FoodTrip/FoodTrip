import request from "supertest";
import app from "../../index";
import * as RouteHelpers from "../../helpers/RouteHelpers";
import { ObjectId } from "mongodb";

jest.mock("node-fetch", () => jest.fn());

describe("Mocked: POST /routes", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await RouteHelpers.initializeGeoNamesDatabase();
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

  // Input: api response from openstreetmap api with status code 500
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("External api non ok status", async () => {
    // 500 when trying to search for first city
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal server error" }),
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
  });

  // Input: empty response from openstreetmap api
  // Expected status code: 400
  // Expected behavior: error handled gracefully
  // Expected output: error message mentioning origin not found
  test("External api with empty response", async () => {
    // cant find first city, empty response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Origin"); // error should mention origin since it was empty
  });

  // Input: valid first response and empty second response from openstreetmap api
  // Expected status code: 400
  // Expected behavior: error handled gracefully
  // Expected output: error message mentioning destination not found
  test("External api with empty response", async () => {
    // cant find second city, empty response
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "49.2827", lon: "-123.1207" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Destination"); // error should mention destination since it was empty
  });

  // Input: netowrk error from openstreetmap api
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("External api network error", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce({ message: "Network error", code: 500 });

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

  // Input: two responses with vancouver coordinates from openstreetmap api
  // Expected status code: 400
  // Expected behavior: error handled gracefully
  // Expected output: error message for same start and end city
  test("Same start and end city", async () => {
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "49.2827", lon: "-123.1207" }],
      }) // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "49.2827", lon: "-123.1207" }],
      });

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Vancouver",
        numStops: 1,
      })
      .expect(400);

    expect(response.body).toHaveProperty(
      "error",
      "Same start and end city not allowed"
    );
  });

  // Input: two responses with vancouver and nanaimo coordinates from openstreetmap api
  // Expected status code: 400
  // Expected behavior: error handled gracefully
  // Expected output: error message for too many stops
  test("Too many stops", async () => {
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "49.2827", lon: "-123.1207" }],
      }) // nanaimo
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "49.1638", lon: "-123.9381" }],
      });

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Nanaimo",
        numStops: 99999999999,
      })
      .expect(400);

    expect(response.body).toHaveProperty(
      "error",
      "Number of stops must be at most"
    );
  });

  // Input: negative number of stops
  // Expected status code: 400
  // Expected behavior: error handled gracefully
  // Expected output: error message for improper number of stops
  test("Negative number of stops", async () => {
    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Nanaimo",
        numStops: -1,
      })
      .expect(400);

    expect(response.body).toHaveProperty(
      "error",
      "Number of stops must be at least 1"
    );
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

  // Input: valid trip id and empty in-memory database
  // Expected status code: 404
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Empty database", async () => {
    // in-memory db cleared by jest setup
    const tripID = new ObjectId(123);
    const response = await request(app)
      .get(`/routes/${tripID.toHexString()}`)
      .expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");
  });

  // Input: tripID with invalid format
  // Expected status code: 400
  // Expected behavior: error handled gracefully
  // Expected output: error message for invalid tripID format
  test("Invalid tripID format", async () => {
    const tripID = "123"; // not a valid ObjectId
    const response = await request(app).get(`/routes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");
  });

  // Input: valid trip id with mocked valid route
  // Expected status code: 200
  // Expected behavior: route returned successfully
  // Expected output: route object
  test("Valid tripID and route returned", async () => {
    jest
      .spyOn(RouteHelpers, "getRouteFromDb")
      .mockResolvedValue({ mock: "route" });

    const tripID = new ObjectId(123);
    const response = await request(app)
      .get(`/routes/${tripID.toHexString()}`)
      .expect(200);

    expect(response.body).toHaveProperty("mock", "route");
    expect(RouteHelpers.getRouteFromDb).toHaveBeenCalled;
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

  // Input: valid trip id and empty in-memory database
  // Expected status code: 404
  // Expected behavior: error handled gracefully
  // Expected output: error message for route not found
  test("Empty database", async () => {
    // in-memory db cleared by jest setup afterEach
    const tripID = new ObjectId(123);
    const response = await request(app)
      .delete(`/routes/${tripID.toHexString()}`)
      .expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");
  });

  // Input: tripID with invalid format
  // Expected status code: 400
  // Expected behavior: error handled gracefully
  // Expected output: error message for invalid tripID format
  test("Invalid tripID format", async () => {
    const tripID = "123"; // not a valid ObjectId
    const response = await request(app).delete(`/routes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");
  });

  // Input: valid tripID with mocked successful deletion
  // Expected status code: 200
  // Expected behavior: route deleted successfully
  // Expected output: success message
  test("Valid tripID and route deleted", async () => {
    jest.spyOn(RouteHelpers, "deleteRouteFromDb").mockResolvedValue(1);

    const tripID = new ObjectId(123);
    const response = await request(app)
      .delete(`/routes/${tripID.toHexString()}`)
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty(
      "message",
      "Route deleted successfully"
    );
    expect(RouteHelpers.deleteRouteFromDb).toHaveBeenCalled;
  });
});
