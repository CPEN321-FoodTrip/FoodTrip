import request from "supertest";
import app from "../../index";
import { client } from "../../services";

const DB_NAME = "preferences";
const COLLECTION_NAME = "allergies";

// Interface POST /preferences/allergies
describe("Unmocked: POST /preferences/allergies", () => {
  // Input: valid userID and allergy
  // Expected status code: 201
  // Expected behavior: allergy added to db
  // Expected output: success message
  test("Valid allergy", async () => {
    const userID = "1";
    const allergy = "peanut";

    const response = await request(app)
      .post("/preferences/allergies")
      .send({ userID, allergy })
      .expect(201);

    expect(response.body.message).toBe("Allergy added successfully");

    // verify db update
    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .findOne({ userID });

    expect(result).toHaveProperty("allergy", allergy);

    // db cleanup done by afterEach in jest.setup.ts
  });

  // Input: missing parameters
  // Expected status code: 400
  // Expected behavior: no db update
  // Expected output: error message mentioning missing parameters
  test("Missing parameters", async () => {
    const countBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/preferences/allergies")
      .send({})
      .expect(400);

    // error should mention parameters missing
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("userID")
      )
    ).toBe(true);
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("allergy")
      )
    ).toBe(true);

    // no db update
    const countAfter = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();
    expect(countAfter).toBe(countBefore);
  });
});

// Interface GET /preferences/allergies/:id
describe("Unmocked: GET /preferences/allergies/:id", () => {
  // Input: valid userID with allergies
  // Expected status code: 200
  // Expected behavior: allergies retrieved from db
  // Expected output: list of allergies
  test("Valid allergies retrieved", async () => {
    const userID = "1";
    const allergies = ["peanut", "shellfish", "soy"];

    // insert allergies
    await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .insertMany(allergies.map((allergy) => ({ userID, allergy })));

    const response = await request(app)
      .get(`/preferences/allergies/${userID}`)
      .expect(200);

    expect(response.body).toEqual(allergies);

    // db cleanup done by afterEach in jest.setup.ts
  });

  // Input: valid userID with no allergies
  // Expected status code: 404
  // Expected behavior: no allergies found in db
  // Expected output: error message
  test("No allergies", async () => {
    const userID = "1";

    const response = await request(app)
      .get(`/preferences/allergies/${userID}`)
      .expect(404);

    expect(response.body.error).toBe("No allergies found");
  });
});

// Interface DELETE /preferences/allergies/:id/:allergy
describe("Unmocked: DELETE /preferences/allergies/:id/:allergy", () => {
  // Input: valid userID and allergy
  // Expected status code: 200
  // Expected behavior: allergy deleted from db
  // Expected output: success message
  test("Valid deletion", async () => {
    const userID = "1";
    const allergy = "peanut";

    // insert allergy
    await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .insertOne({ userID, allergy });

    const response = await request(app)
      .delete(`/preferences/allergies/${userID}/${allergy}`)
      .expect(200);

    expect(response.body.message).toBe("Allergy deleted successfully");

    // verify db update
    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .findOne({ userID });

    expect(result).toBeNull();

    // db cleanup done by afterEach in jest.setup.ts
  });

  // Input: valid userID with no allergies
  // Expected status code: 404
  // Expected behavior: db not updated
  // Expected output: error message
  test("No allergies", async () => {
    const countBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();

    const userID = "1";
    const allergy = "peanut";

    const response = await request(app)
      .delete(`/preferences/allergies/${userID}/${allergy}`)
      .expect(404);

    expect(response.body.error).toBe("Allergy not found");

    // no db update
    const countAfter = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();
    expect(countAfter).toBe(countBefore);
  });
});
