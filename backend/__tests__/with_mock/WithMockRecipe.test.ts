import request from "supertest";
import { mocked } from "jest-mock";
import app from "../../index";
import * as RecipeHelper from "../../helpers/RecipeHelper";
import { Recipe, RecipeDBEntry } from "../../interfaces/RecipeInterfaces";
import { client } from "../../services";
import { ObjectId } from "mongodb";
import { RouteDBEntry } from "../../interfaces/RouteInterfaces";

jest.mock("node-fetch", () => jest.fn());

const RECIPES_DB_NAME = "recipes";
const RECIPE_COLLECTION_NAME = "recipes";

const SAMPLE_RECIPE = {
  tripID: "1234",
  recipes: [
    {
      recipeName: "Winnipeg Chicken Curry",
      recipeID: 1,
      url: "http://www.food.com/recipe/winnipeg-chicken-curry-2930",
      ingredients: [
        "3 tablespoons butter",
        "2 onions, peeled and thinly sliced",
        "2 tablespoons curry powder",
        "2 chicken breasts",
        "2 cups chicken stock, heated",
        "1 tablespoon cornstarch",
        "2 tablespoons water, cold",
        "1⁄4 cup cream (I use milk)",
        "salt & pepper",
      ],
    },
  ],
};

const SAMPLE_RECIPES_LIST: Recipe[] = [
  {
    recipeName: "Winnipeg Chicken Curry",
    recipeID: 1,
    url: "http://www.food.com/recipe/winnipeg-chicken-curry-2930",
    ingredients: [
      "3 tablespoons butter",
      "2 onions, peeled and thinly sliced",
      "2 tablespoons curry powder",
      "2 chicken breasts",
      "2 cups chicken stock, heated",
      "1 tablespoon cornstarch",
      "2 tablespoons water, cold",
      "1⁄4 cup cream (I use milk)",
      "salt & pepper",
    ],
  },
  {
    recipeName: "Chicken Curry",
    recipeID: 2,
    url: "http://www.food.com/recipe/chicken-curry-2930",
    ingredients: [
      "3 tablespoons butter",
      "2 onions, peeled and thinly sliced",
      "2 tablespoons curry powder",
      "2 chicken breasts",
      "2 cups chicken stock, heated",
      "1 tablespoon cornstarch",
      "2 tablespoons water, cold",
      "1⁄4 cup cream (I use milk)",
      "salt & pepper",
    ],
  },
];

const MOCK_ROUTE: RouteDBEntry = {
  userID: "test-user",
  route: {
    start_location: {
      latitude: 0,
      longitude: 0,
      name: "",
      population: 0,
    },
    end_location: {
      latitude: 0,
      longitude: 0,
      name: "",
      population: 0,
    },
    stops: [
      {
        location: {
          latitude: 0,
          longitude: 0,
          name: "",
          population: 0,
        },
        distanceFromStart: 0,
        cumulativeDistance: 0,
        segmentPercentage: 0,
      },
    ],
  },
};

const MOCK_ROUTE_NO_STOPS: RouteDBEntry = {
  userID: "test-user",
  route: {
    start_location: {
      latitude: 0,
      longitude: 0,
      name: "",
      population: 0,
    },
    end_location: {
      latitude: 0,
      longitude: 0,
      name: "",
      population: 0,
    },
    stops: [],
  },
};

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
  // Input: valid tripID
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Fail external api request", async () => {
    // mock no response from edamam api call, cause it to fail

    // add mock route to db
    const result = await client
      .db("route_data")
      .collection<RouteDBEntry>("routes")
      .insertOne(MOCK_ROUTE);

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: result.insertedId.toHexString(),
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
  });

  // Mocked behavior: mock edamam api call to return 503 status response
  // Input: valid tripID
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("External api non ok status", async () => {
    // 503 when trying to search for first recipe
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => Promise.resolve({ error: "Service Unavailable" }),
    });

    // add mock route to db
    const route_response = await client
      .db("route_data")
      .collection<RouteDBEntry>("routes")
      .insertOne(MOCK_ROUTE);

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: route_response.insertedId.toHexString(),
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
  });

  // Mocked behavior: RecipeHelper.saveRecipesToDb throws an error and RecipeHelper.createRecipesfromRoute
  //                  returns a valid recipe
  // Input: tripID valid
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Insert database failure", async () => {
    jest.spyOn(RecipeHelper, "createRecipesfromRoute").mockResolvedValue([
      {
        recipeName: "recipe",
        recipeID: 1,
        url: "url",
        ingredients: ["ingredient"],
      },
    ]);

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
    expect(RecipeHelper.createRecipesfromRoute).toHaveBeenCalled();
    expect(RecipeHelper.saveRecipesToDb).toHaveBeenCalled();
    jest.resetModules();
  });

  // Mocked behavior: RecipeHelper.createRecipesfromRoute has an empty implementation
  // Input: invalid tripID
  // Expected status code: 400
  // Expected behavior: createRecipesfromRoute not called
  // Expected output: error message for invalid tripID format
  test("Invalid tripID format", async () => {
    jest.spyOn(RecipeHelper, "createRecipesfromRoute").mockImplementation();

    const response = await request(app)
      .post("/recipes")
      .send({ tripID: "invalidObjectId" }); // Invalid ObjectId format

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid tripID format");
    expect(RecipeHelper.createRecipesfromRoute).not.toHaveBeenCalled();
  });

  /// Mocked behavior: RecipeHelper.saveRecipesToDb has an empty implementation
  // Input: valid tripID and route with no stops in db
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("No stops found in route", async () => {
    jest.spyOn(RecipeHelper, "saveRecipesToDb").mockImplementation();

    const result = await client
      .db("route_data")
      .collection<RouteDBEntry>("routes")
      .insertOne(MOCK_ROUTE_NO_STOPS);

    const response = await request(app)
      .post("/recipes")
      .send({ tripID: result.insertedId.toHexString() })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    jest.resetModules();
  });

  // Mocked behavior: fetch response with 401 status
  // Input: valid tripID and route with no stops in db
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Missing API key", async () => {
    const originalApiKey = process.env.EDAMAM_API_KEY;
    const originalAppId = process.env.EDAMAM_APP_ID;
    process.env.EDAMAM_APP_ID = undefined;
    process.env.EDAMAM_API_KEY = undefined;

    const mockResponse = {
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ message: "Invalid API credentials" }),
    } as Response;

    mocked(fetch).mockResolvedValueOnce(mockResponse);

    // spy on console.error to verify it's called
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(jest.fn());

    // expect the function to throw
    const response = await request(app)
      .post("/recipes")
      .send({ tripID: new ObjectId().toHexString() })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");

    // verify that console.error was called with the expected message
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

  /// Mocked behavior: fetch response with valid recipe but missing recipeName and uri
  // Input: valid tripID
  // Expected status code: 201
  // Expected behavior: recipe added to database
  // Expected output: recipe with empty recipeName and uri
  test("Response with empty recipeName and uri", async () => {
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

    const response = await request(app)
      .post("/recipes")
      .send({ tripID: new ObjectId().toHexString() })
      .expect(201);

    // verify the returned recipe has empty recipeName and recipeID = 0
    expect(response.body).toEqual([
      {
        recipeName: "",
        recipeID: 0,
        url: "http://example.com/recipe",
        ingredients: ["Ingredient 1", "Ingredient 2"],
      },
    ]);
  });

  // Mocked behavior: fetchRecipe returns a valid recipe
  // Input: valid tripID
  // Expected status code: 201
  // Expected behavior: recipe added to database
  // Expected output: list of recipes
  test("Valid recipes returned", async () => {
    jest
      .spyOn(RecipeHelper, "fetchRecipe")
      .mockResolvedValue(SAMPLE_RECIPES_LIST);

    const result = await client
      .db("route_data")
      .collection("routes")
      .insertOne(MOCK_ROUTE);

    const response = await request(app)
      .post("/recipes")
      .send({ tripID: result.insertedId.toHexString() })
      .expect(201);

    expect(response.body).toEqual(SAMPLE_RECIPES_LIST);
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

  // Mocked behavior: RecipeHelper.getRecipesFromDb
  // Input: valid tripID
  // Expected status code: 200 ok
  // Expected behavior: recipes are added to database
  // Expected output: a list of all recipes
  test("Insert database success", async () => {
    // Mock data that matches the expected structure
    const mockRecipeData = {
      recipes: [
        {
          recipeName: "Winnipeg Chicken Curry",
          recipeID: 1,
          url: "http://www.food.com/recipe/winnipeg-chicken-curry-2930",
          ingredients: [
            "3 tablespoons butter",
            "2 onions, peeled and thinly sliced",
            "2 tablespoons curry powder",
            "2 chicken breasts",
            "2 cups chicken stock, heated",
            "1 tablespoon cornstarch",
            "2 tablespoons water, cold",
            "1⁄4 cup cream (I use milk)",
            "salt & pepper",
          ],
        },
      ],
    };

    // Mock the database response
    jest
      .spyOn(RecipeHelper, "getRecipesFromDb")
      .mockResolvedValue(mockRecipeData.recipes); // Return the `recipes` array

    const tripID = new ObjectId(123);

    // Make the request to the endpoint
    const response = await request(app)
      .get(`/recipes/${tripID.toHexString()}`)
      .expect(200);

    // Assertions
    expect(response.body).toEqual(mockRecipeData.recipes);
    expect(RecipeHelper.getRecipesFromDb).toHaveBeenCalledWith(
      tripID.toHexString()
    );
  });

  // Mocked behavior: in-memory db with valid recipe
  // Input: valid trip id with mocked valid recipe
  // Expected status code: 200
  // Expected behavior: recipe retrieved from db successfully
  // Expected output: recipe object
  test("Retrieve valid recipe from in-mem", async () => {
    // setup: insert sample recipe into db
    const db = client.db(RECIPES_DB_NAME);
    const collection = db.collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME);
    await collection.insertOne(SAMPLE_RECIPE);

    const response = await request(app)
      .get(`/recipes/${SAMPLE_RECIPE.tripID}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty(
      "recipeName",
      SAMPLE_RECIPE.recipes[0].recipeName
    );
    expect(response.body[0]).toHaveProperty(
      "recipeID",
      SAMPLE_RECIPE.recipes[0].recipeID
    );
    expect(response.body[0]).toHaveProperty(
      "url",
      SAMPLE_RECIPE.recipes[0].url
    );
    expect(response.body[0]).toHaveProperty(
      "ingredients",
      SAMPLE_RECIPE.recipes[0].ingredients
    );
    expect(response.body).toEqual(SAMPLE_RECIPE.recipes);

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Mocked behavior: RecipeHelper.getRecipesFromDb with mocked recipe object
  // Input: valid trip id with mocked valid recipe
  // Expected status code: 200
  // Expected behavior: recipe returned successfully
  // Expected output: recipe object
  test("Valid tripID and recipe returned", async () => {
    // Mock data that matches the expected structure
    const mockRecipeData = {
      tripID: "1234",
      recipes: SAMPLE_RECIPE.recipes, // Use the recipes array from SAMPLE_RECIPE
    };

    // Mock the database response
    jest
      .spyOn(RecipeHelper, "getRecipesFromDb")
      .mockResolvedValue(mockRecipeData.recipes); // Return the full object with `recipes` property

    // Make the request to the endpoint
    const response = await request(app)
      .get(`/recipes/${SAMPLE_RECIPE.tripID}`)
      .expect(200);

    // Assertions
    expect(response.body).toEqual(SAMPLE_RECIPE.recipes);
    expect(RecipeHelper.getRecipesFromDb).toHaveBeenCalledWith(
      SAMPLE_RECIPE.tripID
    );
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
