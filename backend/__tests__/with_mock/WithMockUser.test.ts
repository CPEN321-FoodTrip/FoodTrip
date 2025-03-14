import request from "supertest";
import app from "../../index";
import * as UserHelper from "../../helpers/UserHelper";

describe("Mocked: GET /users/:id/routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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
});
