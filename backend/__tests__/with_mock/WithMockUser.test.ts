import request from "supertest";
import app from "../../index";
import * as UserHelper from "../../helpers/UserHelper";
import { client } from "../../services";
import { RouteDBEntry } from "../../interfaces/RouteInterfaces";

const MOCK_ROUTES = [
  {
    userID: "test-user",
    route: {
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
    },
  },
  {
    userID: "test-user",
    route: {
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
    },
  },
];

// Interface GET /users/:id/routes
describe("Mocked: GET /users/:id/routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: UserHelper.getUserRoutesFromDb throws an error
  // Input: valid user ID
  // Expected status code: 500
  // Expected behavior: handle error gracefully
  // Expected output: error message
  test("Database connection failure", async () => {
    const userID = "test-user";
    jest.spyOn(UserHelper, "getUserRoutesFromDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
  });

  // Mocked behavior: empty in-memory database
  // Input: valid userID and empty in-memory database
  // Expected status code: 200
  // Expected behavior: query database for user routes
  // Expected output: empty array
  test("Empty database", async () => {
    // in-memory db cleared by jest setup afterEach
    const userID = "test-user";
    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  // Mocked behavior: UserHelper.getUserRoutesFromDb with empty implementation
  // Input: invalid userID with only whitespaces
  // Expected status code: 400
  // Expected behavior: getUserRoutesFromDb not called
  // Expected output: error message for missing userID
  test("Invalid userID", async () => {
    jest.spyOn(UserHelper, "getUserRoutesFromDb").mockImplementation();
    const userID = "  ";
    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(400);

    expect(response.body).toEqual({ error: "userID is required" });
    expect(UserHelper.getUserRoutesFromDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: UserHelper.getUserRoutesFromDb with mocked routes
  // Input: valid userID with mocked routes
  // Expected status code: 200
  // Expected behavior: query database for user routes
  // Expected output: array of routes
  test("Valid userID", async () => {
    const userID = "test-user";
    jest
      .spyOn(UserHelper, "getUserRoutesFromDb")
      .mockResolvedValue(MOCK_ROUTES);

    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(200);

    expect(response.body).toEqual(MOCK_ROUTES);
    expect(UserHelper.getUserRoutesFromDb).toHaveBeenCalledTimes(1);
  });

  // Mocked behavior: mock routes in in-memory database
  // Input: valid userID with mocked routes in in-memory database
  // Expected status code: 200
  // Expected behavior: query database for user routes
  // Expected output: array of routes
  test("Valid userID, in-mem db", async () => {
    const userID = "test-user";
    await client
      .db("route_data")
      .collection<RouteDBEntry>("routes")
      .insertMany(MOCK_ROUTES);

    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(MOCK_ROUTES.length);
    expect(response.body[0]).toHaveProperty(
      "stops",
      MOCK_ROUTES[0].route.stops
    );
    expect(response.body[1]).toHaveProperty(
      "stops",
      MOCK_ROUTES[1].route.stops
    );
  });
});
