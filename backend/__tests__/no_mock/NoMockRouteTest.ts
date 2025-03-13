import request from "supertest";
import app from "../../index";

describe("Unmocked: POST /generate-route", () => {
  let tripID = "";
  const userID = "test-user";

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid request", async () => {
    const response = await request(app)
      .post("/generate-route")
      .send({
        userID,
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 3,
      })
      .expect(200);

    expect(response.body).toHaveProperty("tripID");
    expect(response.body).toHaveProperty("stops");
    expect(Array.isArray(response.body.stops)).toBe(true);
    tripID = response.body.tripID;
  });
});

describe("Unmocked: GET /get-route", () => {
  let tripID = "";

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid route", async () => {
    const response = await request(app)
      .get("/get-route")
      .query({ tripID })
      .expect(200);

    expect(response.body).toHaveProperty("start_location");
    expect(response.body).toHaveProperty("end_location");
  });

  test("Invalid get deleted route", async () => {
    await request(app).get("/get-route").query({ tripID }).expect(404);
  });
});

describe("Unmocked: GET /get-routes", () => {
  const userID = "test-user";

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid routes", async () => {
    const response = await request(app)
      .get("/get-routes")
      .query({ userID })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("Unmocked: DELETE /delete-route", () => {
  const tripID = "";

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid deletion", async () => {
    const response = await request(app)
      .delete("/delete-route")
      .query({ tripID })
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
  });
});
