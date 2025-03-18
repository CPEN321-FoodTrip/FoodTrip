import request from "supertest";
import app from "../../index";
import * as RecipeHelper from "../../helpers/RecipeHelper";
import { client } from "../../services";
import { ObjectId } from "mongodb";

jest.mock("node-fetch", () => jest.fn());

// Interface POST /recipes
describe("Mocked: POST /recipes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: mock edamam api call that does not get received
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Fail external api request", async () => {
    // mock no response from edamam api call, cause it to fail
    global.fetch = jest.fn();

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: "test-user",
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
  });

  // Mocked behavior: mock edamam api call to return 503 status response
  // Input: valid tripID
  // Expected status code: 503
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("External api non ok status", async () => {
    // 503 when trying to search for first recipe
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => Promise.resolve({ error: "Service Unavailable" }),
    });

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: new ObjectId().toHexString(),
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
  });

  // Mocked behavior: RecipeHelper.saveRecipesToDb throws an error and mock edamam api call to return valid recipe
  // Input: tripID valid
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Insert database failure", async () => {
    const mockResponse = {
      hits: [
        {
          recipe: {
            label: "Mock Pancakes",
            image: "https://mockimage.com/pancakes.jpg",
          },
        },
      ],
    };
    global.fetch = jest.fn().mockResolvedValueOnce(mockResponse); // mock edamam api call

    // database failure
    jest.spyOn(RecipeHelper, "saveRecipesToDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: new ObjectId().toHexString(),
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(RecipeHelper.saveRecipesToDb).toHaveBeenCalled();
  });

  // Mocked behavior: mock Edamam api call to return valid
  // Input: valid userID, origin, destination, numStops all valid
  // Expected status code: 201
  // Expected behavior: route saved successfully
  // Expected output: success message
  test("Valid request", async () => {
    global.fetch = jest.fn();

    const response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Nanaimo",
        numStops: 10,
      })
      .expect(201);

    expect(response.body).toHaveProperty("tripID");
    expect(response.body).toHaveProperty("start_location");
    expect(response.body).toHaveProperty("end_location");
    expect(Array.isArray(response.body.stops)).toBe(true);
    expect(response.body.stops).toHaveLength(10); // 10 stops

    // check if route added to in-memory db which was cleared after last test by afterEach in jest setup
    const result = await client
      .db("route_data")
      .collection("routes")
      .findOne({ userID: "test-user" });
    expect(result).not.toBeNull();
  });

  // Test specifically for missing API keys
  test("Missing API keys", async () => {
    const originalApiKey = process.env.EDAMAM_API_KEY;
    delete process.env.EDAMAM_API_KEY;

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: "test-user",
      })
      .expect(500);
    expect(response.body).toHaveProperty("error", "API key is required");

    if (originalApiKey !== undefined) {
      process.env.EDAMAM_API_KEY = originalApiKey;
    }
    // Reset modules
    jest.resetModules();
  });
});

// Interface GET /recipes/:id
describe("Mocked: GET /recipes/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: RecipeHelper.getRecipesFromDb throws an error
  // Input: valid tripID
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database connection failure", async () => {
    const tripID = new ObjectId(123);
    jest.spyOn(RecipeHelper, "getRecipesFromDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .get(`/recipes/${tripID.toHexString()}`)
      .expect(500);
    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(RecipeHelper.getRecipesFromDb).toHaveBeenCalled();
  });

  // Mocked behavior: empty in-memory database
  // Input: valid tripID
  // Expected status code: 404
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Empty database", async () => {
    // in-memory db cleared by jest setup
    const tripID = new ObjectId(123);
    const response = await request(app)
      .get(`/recipes/${tripID.toHexString()}`)
      .expect(404);
    expect(response.body).toHaveProperty(
      "error",
      "No recipes found for tripID"
    );
  });

  // Mocked behavior: RecipeHelper.getRecipesFromDb with empty implementation
  // Input: tripID with invalid format
  // Expected status code: 400
  // Expected behavior: getRecipesFromDb not called
  // Expected output: error message for invalid tripID format
  test("Invalid tripID format", async () => {
    jest.spyOn(RecipeHelper, "getRecipesFromDb").mockImplementation();
    const tripID = "123"; // not a valid ObjectId
    const response = await request(app).get(`/recipes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");
    expect(RecipeHelper.getRecipesFromDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: RecipeHelper.getRecipesFromDb with mocked route object
  // Input: valid trip id with mocked valid route
  // Expected status code: 200
  // Expected behavior: route returned successfully
  // Expected output: route object
  test("Valid tripID and route returned", async () => {
    jest
      .spyOn(RecipeHelper, "getRecipesFromDb")
      .mockResolvedValue([
        { label: "Mock Recipe", image: "https://mockimage.com/recipe.jpg" },
      ]);

    const tripID = new ObjectId(123);
    const response = await request(app)
      .get(`/recipes/${tripID.toHexString()}`)
      .expect(200);

    expect(response.body).toHaveProperty("mock", "route");
    expect(RecipeHelper.getRecipesFromDb).toHaveBeenCalled;
  });
});

// Interface DELETE /recipes/:id
describe("Mocked: DELETE /recipes/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: RecipeHelpers.deleteRecipesFromDb throws an error
  // Input: valid trip id
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database connection failure", async () => {
    const tripID = new ObjectId(123);
    jest.spyOn(RecipeHelper, "deleteRecipesFromDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .delete(`/recipes/${tripID.toHexString()}`)
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(RecipeHelper.deleteRecipesFromDb).toHaveBeenCalled();
  });

  // Mocked behavior: empty in-memory database
  // Input: valid tripID and empty in-memory database
  // Expected status code: 404
  // Expected behavior: error handled gracefully
  // Expected output: error message for route not found
  test("Empty database", async () => {
    // in-memory db cleared by jest setup afterEach
    const tripID = new ObjectId(123);
    const response = await request(app)
      .delete(`/recipes/${tripID.toHexString()}`)
      .expect(404);
    expect(response.body).toHaveProperty(
      "error",
      "No recipes found for tripID"
    );
  });

  // Mocked behavior: RecipeHelper.deleteRecipesFromDb with empty implementation
  // Input: tripID with invalid format
  // Expected status code: 400
  // Expected behavior: deleteRecipeFromDb not called
  // Expected output: error message for invalid tripID format
  test("Invalid tripID format", async () => {
    jest.spyOn(RecipeHelper, "deleteRecipesFromDb").mockImplementation();

    const tripID = "123"; // not a valid ObjectId
    const response = await request(app)
      .delete(`/recipes/${tripID}`)
      .expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");

    expect(RecipeHelper.deleteRecipesFromDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: RecipeHelper.deleteRecipesFromDb with mocked successful deletion
  // Input: valid tripID with mocked successful deletion
  // Expected status code: 200
  // Expected behavior: recipes deleted successfully
  // Expected output: success message
  test("Valid tripID and recipes deleted", async () => {
    jest.spyOn(RecipeHelper, "deleteRecipesFromDb").mockResolvedValue(1);

    const tripID = new ObjectId(123);
    const response = await request(app)
      .delete(`/recipes/${tripID.toHexString()}`)
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "Recipes deleted");
    expect(RecipeHelper.deleteRecipesFromDb).toHaveBeenCalled;
  });
});
