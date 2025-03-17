import request from "supertest";
import app from "../../index";
import * as RouteHelpers from "../../helpers/RouteHelpers";
import { ObjectId } from "mongodb";
import { client } from "../../services";

jest.mock("node-fetch", () => jest.fn());

// Interface POST /routes
describe("Mocked: POST /routes", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await RouteHelpers.initializeGeoNamesDatabase();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: mock openstreetmap api call to return no coordinates for Vancouver and Toronto
  // Input: user id, origin, destination, numStops all valid
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Fail external api request", async () => {
    // mock no response coordinates from openstreetmap api call, cause it to fail
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

  // Mocked behavior: mock openstreetmap api call to return coordinates for Vancouver but not Toronto
  // Input: user id, origin, destination, numStops all valid
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
        json: async () =>
          Promise.resolve([{ lat: "49.2827", lon: "-123.1207" }]),
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

  // Mocked behavior: mock openstreetmap api call to return 500 status response
  // Input: valid userID, origin, destination, numStops parameters
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("External api non ok status", async () => {
    // 500 when trying to search for first city
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => Promise.resolve({ error: "Internal server error" }),
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

  // Mocked behavior: mock openstreetmap api call to return empty response for not found city
  //                  and mock RouteHelpers.saveRouteToDb to have empty implementation
  // Input: valid userID, destination, numStops parameters and invalid origin
  // Expected status code: 400
  // Expected behavior: saveRouteToDb not called
  // Expected output: error message mentioning origin not found
  test("External api with not found first city response", async () => {
    // cant find first city, empty response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => Promise.resolve([]),
    });
    jest.spyOn(RouteHelpers, "saveRouteToDb").mockImplementation();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "NonExistentCity",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    // error should mention origin since it couldn't be found
    expect(response.body.error).toContain("Origin");
    expect(RouteHelpers.saveRouteToDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: mock openstreetmap api call to return empty response for not found second city
  //                  and mock RouteHelpers.saveRouteToDb to have empty implementation
  // Input: valid userID, origin, numStops parameters and invalid destination
  // Expected status code: 400
  // Expected behavior: saveRouteToDb not called
  // Expected output: error message mentioning destination not found
  test("External api with not found second city response", async () => {
    // cant find second city, empty response
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          Promise.resolve([{ lat: "49.2827", lon: "-123.1207" }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => Promise.resolve([]),
      });
    jest.spyOn(RouteHelpers, "saveRouteToDb").mockImplementation();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "NonExistentCity",
        numStops: 1,
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    // error should mention destination since it coulnd't be found
    expect(response.body.error).toContain("Destination");
    expect(RouteHelpers.saveRouteToDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: mock openstreetmap api call to return network error
  // Input: valid userID, origin, destination, numStops parameters
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

  // Mocked behavior: mock openstreetmap api call to return valid coordinates for Vancouver and Toronto
  //                  and mock RouteHelpers.saveRouteToDb to have empty implementation
  // Input: origin and destination as same city
  // Expected status code: 400
  // Expected behavior: saveRouteToDb not called
  // Expected output: error message for same start and end city
  test("Same start and end city", async () => {
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          Promise.resolve([{ lat: "49.2827", lon: "-123.1207" }]),
      }) // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          Promise.resolve([{ lat: "49.2827", lon: "-123.1207" }]),
      });
    jest.spyOn(RouteHelpers, "saveRouteToDb").mockImplementation();

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
    expect(RouteHelpers.saveRouteToDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: mock openstreetmap api call to return valid coordinates for Vancouver and Nanaimo
  //                  and mock RouteHelpers.saveRouteToDb to have empty implementation
  // Input: numStops with too large value
  // Expected status code: 400
  // Expected behavior: saveRouteToDb not called
  // Expected output: error message for too many stops
  test("Too many stops", async () => {
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          Promise.resolve([{ lat: "49.2827", lon: "-123.1207" }]),
      }) // nanaimo
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          Promise.resolve([{ lat: "49.1638", lon: "-123.9381" }]),
      });
    jest.spyOn(RouteHelpers, "saveRouteToDb").mockImplementation();

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
    expect(RouteHelpers.saveRouteToDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: mock RouteHelpers.saveRouteToDb to have empty implementation
  // Input: negative number of stops
  // Expected status code: 400
  // Expected behavior: saveRouteToDb not called
  // Expected output: error message for improper number of stops
  test("Negative number of stops", async () => {
    jest.spyOn(RouteHelpers, "saveRouteToDb").mockImplementation();
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
    expect(RouteHelpers.saveRouteToDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: RouteHelpers.saveRouteToDb throws an error
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
        json: async () =>
          Promise.resolve([{ lat: "49.2827", lon: "-123.1207" }]),
      })
      // toronto
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          Promise.resolve([{ lat: "43.6532", lon: "-79.3832" }]),
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

  // Mocked behavior: mock openstreetmap api call to return valid coordinates for Vancouver and Nanaimo
  // Input: valid userID, origin, destination, numStops all valid
  // Expected status code: 201
  // Expected behavior: route saved successfully
  // Expected output: success message
  test("Valid request", async () => {
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          Promise.resolve([{ lat: "49.2827", lon: "-123.1207" }]),
      })
      // nanaimo
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          Promise.resolve([{ lat: "49.1638", lon: "-123.9381" }]),
      });

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Nanaimo",
        numStops: 10,
      })
      .expect(201);

    expect(response.body).toHaveProperty("tripID");
    expect(response.body).toHaveProperty("start_location");
    expect(response.body).toHaveProperty("end_location");
    expect(Array.isArray(response.body.stops)).toBe(true);
    expect(response.body.stops).toHaveLength(10); // 10 stops

    // check if route added to in-memory db which was cleared after last test by afterEach in jest setup
    const result = await client
      .db("route_data")
      .collection("routes")
      .findOne({ userID: "test-user" });
    expect(result).not.toBeNull();
  });
});

// Interface GET /routes/:id
describe("Mocked: GET /routes/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: RouteHelpers.getRouteFromDb throws an error
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

  // Mocked behavior: empty in-memory database
  // Input: valid tripID
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

  // Mocked behavior: RouteHelpers.getRouteFromDb with empty implementation
  // Input: tripID with invalid format
  // Expected status code: 400
  // Expected behavior: getRouteFromDb not called
  // Expected output: error message for invalid tripID format
  test("Invalid tripID format", async () => {
    jest.spyOn(RouteHelpers, "getRouteFromDb").mockImplementation();
    const tripID = "123"; // not a valid ObjectId
    const response = await request(app).get(`/routes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");
    expect(RouteHelpers.getRouteFromDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: RouteHelpers.getRouteFromDb with mocked route object
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
    expect(RouteHelpers.getRouteFromDb).toHaveBeenCalled();
  });
});

// Interface DELETE /routes/:id
describe("Mocked: DELETE /routes/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: RouteHelpers.deleteRouteFromDb throws an error
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

  // Mocked behavior: empty in-memory database
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

  // Mocked behavior: RouteHelpers.deleteRouteFromDb with empty implementation
  // Input: tripID with invalid format
  // Expected status code: 400
  // Expected behavior: deleteRouteFromDb not called
  // Expected output: error message for invalid tripID format
  test("Invalid tripID format", async () => {
    jest.spyOn(RouteHelpers, "deleteRouteFromDb").mockImplementation();

    const tripID = "123"; // not a valid ObjectId
    const response = await request(app).delete(`/routes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");

    expect(RouteHelpers.deleteRouteFromDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: RouteHelpers.deleteRouteFromDb with mocked successful deletion
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
    expect(RouteHelpers.deleteRouteFromDb).toHaveBeenCalled();
  });
});
