import request from "supertest";
import app from "../../index";
import * as PreferenceHelper from "../../helpers/PreferenceHelper";

// Interface POST /preferences/allergies
describe("Mocked: POST /preferences/allergies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: addAllergyToDb throws an error
  // Input: valid userID and allergy
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database failure", async () => {
    jest.spyOn(PreferenceHelper, "addAllergyToDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .post("/preferences/allergies")
      .send({
        userID: "123",
        allergy: "peanut",
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(PreferenceHelper.addAllergyToDb).toHaveBeenCalledTimes(1);
  });

  // Mocked behavior: getAllergiesFromDb has empty implementation
  // Input: valid userID and allergy
  // Expected status code: 201
  // Expected behavior: PreferenceHelper.addAllergyToDb called
  // Expected output: success message
  test("Valid insert, spy db helper", async () => {
    jest.spyOn(PreferenceHelper, "addAllergyToDb").mockImplementation();

    const response = await request(app)
      .post("/preferences/allergies")
      .send({
        userID: "123",
        allergy: "peanut",
      })
      .expect(201);

    expect(response.body).toHaveProperty(
      "message",
      "Allergy added successfully"
    );
    expect(PreferenceHelper.addAllergyToDb).toHaveBeenCalledTimes(1);
  });

  // Mocked behavior: in-memory db is empty
  // Input: valid userID and allergy
  // Expected status code: 201
  // Expected behavior: allergy added to in-memory db
  // Expected output: success message
  test("Valid insert, in-mem db", async () => {
    const response = await request(app)
      .post("/preferences/allergies")
      .send({ userID: "123", allergy: "peanut" })
      .expect(201);

    expect(response.body).toHaveProperty(
      "message",
      "Allergy added successfully"
    );
  });
});

// Interface GET /preferences/allergies/:id
describe("Mocked: GET /preferences/allergies/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: getAllergiesFromDb throws an error
  // Input: valid userID
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database failure", async () => {
    jest
      .spyOn(PreferenceHelper, "getAllergiesFromDb")
      .mockImplementation(() => {
        throw new Error("Forced error");
      });

    const response = await request(app)
      .get("/preferences/allergies/123")
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(PreferenceHelper.getAllergiesFromDb).toHaveBeenCalledTimes(1);
  });

  // Mocked behavior: getAllergiesFromDb returns empty list
  // Input: valid userID
  // Expected status code: 404
  // Expected behavior: PreferenceHelper.getAllergiesFromDb called
  // Expected output: error message
  test("No allergies", async () => {
    jest.spyOn(PreferenceHelper, "getAllergiesFromDb").mockResolvedValue([]);

    const response = await request(app)
      .get("/preferences/allergies/123")
      .expect(404);

    expect(response.body).toHaveProperty("error", "No allergies found");
    expect(PreferenceHelper.getAllergiesFromDb).toHaveBeenCalledTimes(1);
  });

  // Mocked behavior: getAllergiesFromDb returns list of allergies
  // Input: valid userID
  // Expected status code: 200
  // Expected behavior: PreferenceHelper.getAllergiesFromDb called
  // Expected output: list of allergies
  test("Valid allergy", async () => {
    jest.spyOn(PreferenceHelper, "getAllergiesFromDb").mockResolvedValue([
      {
        allergy: "peanut",
        userID: "123",
      },
      {
        allergy: "egg",
        userID: "123",
      },
    ]);

    const response = await request(app)
      .get("/preferences/allergies/123")
      .expect(200);

    expect(response.body).toEqual(["peanut", "egg"]);
    expect(PreferenceHelper.getAllergiesFromDb).toHaveBeenCalledTimes(1);
  });

  // Mocked behavior: in-memory db is empty
  // Input: valid userID
  // Expected status code: 404
  // Expected behavior: in-memory db is empty
  // Expected output: error message
  test("Empty database", async () => {
    // in-memory db is empty
    const response = await request(app)
      .get("/preferences/allergies/123")
      .expect(404);
    expect(response.body).toHaveProperty("error", "No allergies found");
  });
});

// Interface DELETE /preferences/allergies/:id/:allergy
describe("Mocked: DELETE /preferences/allergies/:id/:allergy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: deleteAllergyFromDb throws an error
  // Input: valid userID and allergy
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database failure", async () => {
    jest
      .spyOn(PreferenceHelper, "deleteAllergyFromDb")
      .mockImplementation(() => {
        throw new Error("Forced error");
      });

    const response = await request(app)
      .delete("/preferences/allergies/123/peanut")
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(PreferenceHelper.deleteAllergyFromDb).toHaveBeenCalledTimes(1);
  });

  // Mocked behavior: deleteAllergyFromDb returns 0
  // Input: valid userID and allergy
  // Expected status code: 404
  // Expected behavior: PreferenceHelper.deleteAllergyFromDb called
  // Expected output: error message
  test("No allergies", async () => {
    jest.spyOn(PreferenceHelper, "deleteAllergyFromDb").mockResolvedValue(0);

    const response = await request(app)
      .delete("/preferences/allergies/123/peanut")
      .expect(404);

    expect(response.body).toHaveProperty("error", "Allergy not found");
    expect(PreferenceHelper.deleteAllergyFromDb).toHaveBeenCalledTimes(1);
  });

  // Mocked behavior: deleteAllergyFromDb returns 1
  // Input: valid userID and allergy
  // Expected status code: 200
  // Expected behavior: PreferenceHelper.deleteAllergyFromDb called
  // Expected output: success message
  test("Valid allergy", async () => {
    jest.spyOn(PreferenceHelper, "deleteAllergyFromDb").mockResolvedValue(1);

    const response = await request(app)
      .delete("/preferences/allergies/123/peanut")
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "Allergy deleted successfully"
    );
    expect(PreferenceHelper.deleteAllergyFromDb).toHaveBeenCalledTimes(1);
  });

  // Mocked behavior: in-memory db is empty
  // Input: valid userID and allergy
  // Expected status code: 404
  // Expected behavior: in-memory db is empty
  // Expected output: error message
  test("Empty database", async () => {
    // in-memory db is empty
    const response = await request(app)
      .delete("/preferences/allergies/123/peanut")
      .expect(404);
    expect(response.body).toHaveProperty("error", "Allergy not found");
  });
});
