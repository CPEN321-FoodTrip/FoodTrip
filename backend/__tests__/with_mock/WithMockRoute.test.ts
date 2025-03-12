import request from "supertest";
import app from "../../index";
import * as RouteHelpers from "../../helpers/RouteHelpers";
import { ObjectId } from "mongodb";

jest.mock("../../helpers/RouteHelpers");

jest.mock("node-fetch", () => jest.fn());

describe("Mocked: POST /generate-route", () => {
  beforeAll(() => {
    // DB connection setup
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Succesful route generated", async () => {
    const tripID = new ObjectId(123);
    const userID = "test-user";
    const mockRoute = {
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
            population: 1400000,
          },
          distanceFromStart: 100,
          cumulativeDistance: 100,
          segmentPercentage: 50,
        },
      ],
    };

    // mock coordinates for vancouver and toronto for response from openstreetmap api call
    global.fetch = jest
      .fn()
      // vancover
      .mockResolvedValueOnce({
        json: async () => [{ lat: "49.2827", lon: "-123.1207" }],
      })
      // toronto
      .mockResolvedValueOnce({
        json: async () => [{ lat: "43.6532", lon: "-79.3832" }],
      });

    jest
      .spyOn(RouteHelpers, "generateRouteStops")
      .mockResolvedValue(mockRoute.stops);
    jest.spyOn(RouteHelpers, "saveRouteToDatabase").mockResolvedValue(tripID);

    const response = await request(app)
      .post("/generate-route")
      .send({
        userID: userID,
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(200);

    expect(response.body).toHaveProperty("tripID");
    expect(String(response.body.tripID)).toBe(String(tripID));
    expect(response.body.stops.length).toBeGreaterThan(0);
  });
});

describe("Mocked: GET /get-route", () => {
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

    jest
      .spyOn(RouteHelpers, "getRouteFromDatabase")
      .mockResolvedValue(mockRoute);

    const response = await request(app)
      .get("/get-route")
      .query({ tripID: tripID.toHexString() })
      .expect(200);

    expect(response.body).toMatchObject(mockRoute);
  });
});
