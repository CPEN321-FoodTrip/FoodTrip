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

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
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

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
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

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Invalid origin city", async () => {
    // mock empty coordinates from openstreetmap api call
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: ";;ee",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Origin"); // error should mention origin
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Invalid destination city", async () => {
    // mock empty coordinates from openstreetmap api call
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ lat: "49.2827", lon: "-123.1207" }],
      })
      // not found destination
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "..;ea'",
        numStops: 1,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Destination"); // error should mention destination
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
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
    jest
      .spyOn(RouteHelpers, "saveRouteToDb")
      .mockRejectedValue(new Error("Database connection failed"));

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
});

describe("Mocked: GET /routes/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Sucessful route retrieved", async () => {
    const tripID = new ObjectId(123);
    const mockRoute = {
      tripID: tripID.toHexString(),
      start_location: {
        name: "Vancouver",
        latitude: 49.2827,
        longitude: -123.1207,
      },
      end_location: { name: "Toronto", latitude: 43.6532, longitude: -79.3832 },
      stops: [
        {
          location: {
            name: "Calgary",
            latitude: 51.0447,
            longitude: -114.0719,
          },
          distanceFromStart: 100,
          cumulativeDistance: 100,
          segmentPercentage: 50,
        },
      ],
    };

    jest.spyOn(RouteHelpers, "getRouteFromDb").mockResolvedValue(mockRoute);

    const response = await request(app)
      .get(`/routes/${tripID.toHexString()}`)
      .expect(200);

    expect(response.body).toMatchObject(mockRoute);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Try to get route that doesn't exist", async () => {
    const tripID = new ObjectId(123);
    // db does not contain any route with this id
    const response = await request(app)
      .get(`/routes/${tripID.toHexString()}`)
      .expect(404);
    expect(response.body).toHaveProperty("error", "Route not found");
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Get database failure", async () => {
    const tripID = new ObjectId(123);
    jest
      .spyOn(RouteHelpers, "getRouteFromDb")
      .mockRejectedValue(new Error("Database connection failed"));

    const response = await request(app)
      .get(`/routes/${tripID.toHexString()}`)
      .expect(500);
    expect(response.body).toHaveProperty("error", "Internal server error");
  });
});

describe("Mocked: DELETE /routes/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Successful route deletion", async () => {
    const tripID = new ObjectId(123);
    jest.spyOn(RouteHelpers, "deleteRouteFromDb").mockResolvedValue(1);

    const response = await request(app)
      .delete(`/routes/${tripID.toHexString()}`)
      .query({ tripID: tripID.toHexString() })
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
  });
});
