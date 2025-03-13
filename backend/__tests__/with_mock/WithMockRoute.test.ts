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

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Succesful route generated", async () => {
    const tripID = new ObjectId(123);
    const userID = "test-user";

    // mock coordinates for vancouver and toronto for response from openstreetmap api call
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

    jest.spyOn(RouteHelpers, "saveRouteToDb").mockResolvedValue(tripID);

    const response = await request(app)
      .post("/routes")
      .send({
        userID: userID,
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(200);

    expect(response.body).toHaveProperty("tripID");
    expect(response.body.tripID).toBe(tripID.toHexString());
    expect(response.body).toHaveProperty("stops");
  });
});

describe("Mocked: GET /routes/:id", () => {
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
  test("Try to get deleted route", async () => {
    const tripID = new ObjectId(123);
    jest.spyOn(RouteHelpers, "getRouteFromDb").mockResolvedValue(null);

    await request(app).get(`/route/${tripID}`).expect(404);
  });
});

describe("Mocked: DELETE /routes/:id", () => {
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
