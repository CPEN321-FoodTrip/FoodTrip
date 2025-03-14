import request from "supertest";
import app from "../../index";
import { ObjectId } from "mongodb";
import * as UserHelper from "../../helpers/UserHelper";

describe("Mocked: GET /users/:id/routes", () => {
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
