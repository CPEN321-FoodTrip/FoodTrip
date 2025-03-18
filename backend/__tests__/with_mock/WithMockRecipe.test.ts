import request from "supertest";
import { mocked } from "jest-mock";
import app from "../../index";
import * as RecipeHelper from "../../helpers/RecipeHelper";
import { RouteDBEntry } from "../../interfaces/RouteInterfaces";
import { client } from "../../services";
import { ObjectId } from "mongodb";

jest.mock("node-fetch", () => jest.fn());
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

global.fetch = jest.fn();

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
    

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: new ObjectId().toHexString(),
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

    const route_response = await request(app)
      .post("/routes")
      .send({
        userID: "test-user",
        origin: "Vancouver",
        destination: "Toronto",
        numStops: 1,
      })
      .expect(201);

      const db = client.db(ROUTES_DB_NAME);
      const collection = db.collection<RouteDBEntry>(ROUTES_COLLECTION_NAME);
      const tripID = route_response.body.tripID;
      const result = await collection.findOne({ _id: new ObjectId(tripID) });
      if (!result){
        console.debug(tripID);
      }
      console.debug(tripID);

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID,
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
    jest.resetModules();
  });

  
  /// Mocked behavior: route_collection.findOne returns a mocked route, and mock edamam
  //  api call to return valid recipe
  // Input: tripID valid
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Missing API keys", async () => {
    const originalApiKey = process.env.EDAMAM_API_KEY;
    const originalAppId = process.env.EDAMAM_APP_ID;
    process.env.EDAMAM_API_KEY = "";
    process.env.EDAMAM_APP_ID = "";

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {
      
    });
    await expect(RecipeHelper.fetchRecipe("query")).rejects.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Detailed recipe fetch error:",
      expect.any(Error)
    );

    if (originalApiKey !== undefined) {
      process.env.EDAMAM_API_KEY = originalApiKey;
      process.env.EDAMAM_APP_ID = originalAppId;
    }
    consoleErrorSpy.mockRestore();
    jest.resetModules();
  });
});

test("should handle recipes with empty recipeName and recipeID = 0", async () => {
  // Arrange: Mock fetch to return a response with empty recipeName and recipeID = 0
  const mockResponse = {
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        hits: [
          {
            recipe: {
              label: "", // Empty recipeName
              uri: "", // Invalid URI (results in recipeID = 0)
              url: "http://example.com/recipe",
              ingredientLines: ["Ingredient 1", "Ingredient 2"],
            },
          },
        ],
      }),
  } as Response;

  mocked(fetch).mockResolvedValueOnce(mockResponse);

  // Act: Call the function
  const recipes = await RecipeHelper.fetchRecipe("query");

  // Assert: Verify the returned recipe has empty recipeName and recipeID = 0
  expect(recipes).toEqual([
    {
      recipeName: "",
      recipeID: 0,
      url: "http://example.com/recipe",
      ingredients: ["Ingredient 1", "Ingredient 2"],
    },
  ]);
});

// Mock fetchRecipe not connecting to Edamam API
test('cannot reach Edamam API', async () => {
  // Mock fetch to return a non-OK response
  mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Act & Assert: Expect the function to throw
    await expect(RecipeHelper.fetchRecipe("invalid-query")).rejects.toThrow("Network error");

    // Assert: Verify that console.error was called with the expected message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Detailed recipe fetch error:",
      expect.any(Error)
    );

    // Clean up the spy
    consoleErrorSpy.mockRestore();
  jest.resetModules();
});

test("should log an error and throw when response is invalid", async () => {
    // Arrange: Mock fetch to return an invalid response
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("Invalid JSON")),
      headers: new Headers(),
      redirected: false,
      type: "basic",
      url: "https://example.com",
      clone: () => mockResponse,
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      text: () => Promise.resolve(""),
    } as Response;

    // Mock fetch to return the invalid response
    mocked(fetch).mockResolvedValueOnce(mockResponse);

    // Spy on console.error to verify it's called
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Act & Assert: Expect the function to throw
    await expect(RecipeHelper.fetchRecipe("invalid-query")).rejects.toThrow("Invalid JSON");

    // Assert: Verify that console.error was called with the expected message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Detailed recipe fetch error:",
      expect.any(Error)
    );

    // Clean up the spy
    consoleErrorSpy.mockRestore();
  });

  test("line 34 coverage", async () => {
    // Arrange: Mock fetch to return a non-OK response
    const mockErrorResponse = {
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: () => Promise.resolve("Invalid query parameter"),
    } as Response;

    mocked(fetch).mockResolvedValueOnce(mockErrorResponse);

    // Spy on console.error to verify it's called
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Act & Assert: Expect the function to throw
    await expect(RecipeHelper.fetchRecipe("invalid-query")).rejects.toThrow(
      "Edamam API Error: 400 - Invalid query parameter"
    );

    // Assert: Verify that console.error was called with the expected message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Detailed recipe fetch error:",
      expect.any(Error)
    );

    // Clean up the spy
    consoleErrorSpy.mockRestore();
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
        {
          recipeName: "Mocked recipe",
          recipeID: 123,
          url: "https://github.com/CPEN321-FoodTrip/FoodTrip",
          ingredients: [
            "3 tablespoons mocked",
            "2 recipes, peeled and thinly sliced",
            "2 tablespoons coffee powder",
          ],
        },
      ],);

    const tripID = new ObjectId(123);
    const response = await request(app)
      .get(`/recipes/${tripID.toHexString()}`)
      .expect(200);
    
    const data = await response.body;
    expect(data[0]).toHaveProperty("ingredients");
    expect(data[0]).toHaveProperty("url");
    expect(data[0]).toHaveProperty("recipeName");
    expect(data[0]).toHaveProperty("recipeID");
    expect(RecipeHelper.getRecipesFromDb).toHaveBeenCalled();
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
    expect(RecipeHelper.deleteRecipesFromDb).toHaveBeenCalled();
  });
});
