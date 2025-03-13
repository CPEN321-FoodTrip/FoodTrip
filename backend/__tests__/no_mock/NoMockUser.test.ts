import request from "supertest";
import app from "../../index";

describe("Unmocked: GET /users/:id/routes", () => {
  const userID = "test-user";

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid routes", async () => {
    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
