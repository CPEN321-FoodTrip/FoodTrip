import request from "supertest";
import app from "../../index";
import * as UserHelper from "../../helpers/UserHelper";

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
  // Input: valid userID with mocked routes in in-memory database
  // Expected status code: 200
  // Expected behavior: query database for user routes
  // Expected output: array of routes
  test("Valid userID", async () => {
    const userID = "test-user";
    const routes = [
      { userID, tripID: "1", route: "route 1" },
      { userID, tripID: "2", route: "route 2" },
    ];
    jest.spyOn(UserHelper, "getUserRoutesFromDb").mockResolvedValue(routes);

    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(200);

    expect(response.body).toEqual(routes);
    expect(UserHelper.getUserRoutesFromDb).toHaveBeenCalledTimes(1);
  });
});
