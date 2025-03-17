import request from "supertest";
import app from "../../index";
import * as RouteHelpers from "../../helpers/RouteHelpers";
import * as RecipeHelper from "../../helpers/RecipeHelper";
import { ObjectId } from "mongodb";
import { client } from "../../services";

jest.mock("node-fetch", () => jest.fn());


// Interface POST /routes
// Performance test
describe("Performance: POST /routes", () => {
    jest.setTimeout(20000); //20s

  beforeEach(async () => {
    jest.clearAllMocks();
    await RouteHelpers.initializeGeoNamesDatabase();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

// Mocked behavior: mock openstreetmap api call to return valid coordinates for Vancouver and Nanaimo
  // Input: valid userID, origin, destination, numStops all valid
  // Expected status code: 201
  // Expected behavior: route saved successfully
  // Expected output: success message
  test("Single request, 10 stops", async () => {
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
      const start = Date.now(); //begin time after jest sets up inputs

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Nanaimo",
        numStops: 10,
      })
      .expect(201);


      const end = Date.now();
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


    const duration = end - start; //begin timing test assuming that operation succeeded
    console.log(`High-resolution duration: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(2000); // 2s
  });
});