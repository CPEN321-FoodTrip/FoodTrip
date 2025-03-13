import request from "supertest";
import app from "../../index";
import { ObjectId } from "mongodb";
import * as UserHelper from "../../helpers/UserHelper";

describe("Mocked: GET /users/:id/routes", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Sucessful routes retrieved", async () => {
    const tripID = new ObjectId(123);
    const userID = "test-user";
    const mockRoutes = [
      { tripID, userID, start_location: "Vancouver", end_location: "Toronto" },
    ];

    jest.spyOn(UserHelper, "getUserRoutesFromDb").mockResolvedValue(mockRoutes);

    const response = await request(app)
      .get(`/users/${userID}/routes`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty("tripID");
    expect(response.body[0].tripID).toBe(tripID.toHexString());
  });
});
