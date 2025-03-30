import request from "supertest";
import app from "../../index";
import * as RecipeHelper from "../../helpers/RecipeHelper";
import { Recipe, RecipeDBEntry } from "../../interfaces/RecipeInterfaces";
import { client } from "../../services";
import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { RouteDBEntry } from "../../interfaces/RouteInterfaces";

jest.mock("node-fetch", () => jest.fn());

const RECIPES_DB_NAME = "recipes";
const RECIPE_COLLECTION_NAME = "recipes";

const SAMPLE_RECIPE: Recipe = {
  recipeName: "Strawberry and Wild Rice Tartlets",
  recipeID: 3,
  url: "https://www.epicurious.com/recipes/food/views/ba-syn-strawberry-wild-rice-tartlets",
  ingredients: [
    {
      text: "Vegetable oil (for pan)",
      quantity: 0,
      measure: null,
      food: "Vegetable oil",
      weight: 11.459884348,
      foodCategory: "Oils",
      foodId: "food_bt1mzi2ah2sfg8bv7no1qai83w8s",
      image:
        "https://www.edamam.com/food-img/6e5/6e51a63a6300a8ea1b4c4cc68dfaba33.jpg",
    },
    {
      text: "Kosher salt",
      quantity: 0,
      measure: null,
      food: "Kosher salt",
      weight: 5.05583133,
      foodCategory: "Condiments and sauces",
      foodId: "food_a1vgrj1bs8rd1majvmd9ubz8ttkg",
      image:
        "https://www.edamam.com/food-img/694/6943ea510918c6025795e8dc6e6eaaeb.jpg",
    },
    {
      text: "1 cup wild rice",
      quantity: 1,
      measure: "cup",
      food: "wild rice",
      weight: 160,
      foodCategory: "grains",
      foodId: "food_at0h9hean2v4bobxbjzvgbhm51h7",
      image:
        "https://www.edamam.com/food-img/1bc/1bcfd41e4d9869c95647b8040069408c.jpg",
    },
    {
      text: "8 oz. dried tart cherries",
      quantity: 8,
      measure: "ounce",
      food: "tart cherries",
      weight: 226.796185,
      foodCategory: "fruit",
      foodId: "food_b7r68adakprkpxa1rd3rtb33wvaj",
      image:
        "https://www.edamam.com/food-img/553/553b626901dcbde9a74ee66c85f459bc.jpg",
    },
    {
      text: "1 lb. strawberries, hulled, plus halved strawberries for serving",
      quantity: 1,
      measure: "pound",
      food: "strawberries",
      weight: 453.59237,
      foodCategory: "fruit",
      foodId: "food_b4s2ibkbrrucmbabbaxhfau8ay42",
      image:
        "https://www.edamam.com/food-img/00c/00c8851e401bf7975be7f73499b4b573.jpg",
    },
    {
      text: "Small mint leaves (for serving)",
      quantity: 1,
      measure: "serving",
      food: "mint leaves",
      weight: 2.25,
      foodCategory: "Condiments and sauces",
      foodId: "food_bxl4xoga4owdkeay51sy8anesxj5",
      image:
        "https://www.edamam.com/food-img/7f0/7f01cc4f71c5c6ad31051ed74b9c058b.jpg",
    },
  ],
};

const SAMPLE_RECIPES_LIST: Recipe[] = [
  {
    recipeName: "Biscotti Regina",
    recipeID: 113,
    url: "https://www.foodnetwork.com/recipes/biscotti-regina-3608012",
    ingredients: [
      {
        text: "2 1/2 sticks unsalted butter",
        quantity: 2.5,
        measure: "stick",
        food: "unsalted butter",
        weight: 282.5,
        foodCategory: "Dairy",
        foodId: "food_awz3iefajbk1fwahq9logahmgltj",
        image:
          "https://www.edamam.com/food-img/713/71397239b670d88c04faa8d05035cab4.jpg",
      },
      {
        text: "1 cup sugar",
        quantity: 1,
        measure: "cup",
        food: "sugar",
        weight: 200,
        foodCategory: "sugars",
        foodId: "food_axi2ijobrk819yb0adceobnhm1c2",
        image:
          "https://www.edamam.com/food-img/ecb/ecb3f5aaed96d0188c21b8369be07765.jpg",
      },
      {
        text: "3 large eggs",
        quantity: 3,
        measure: "<unit>",
        food: "eggs",
        weight: 150,
        foodCategory: "Eggs",
        foodId: "food_bhpradua77pk16aipcvzeayg732r",
        image:
          "https://www.edamam.com/food-img/a7e/a7ec7c337cb47c6550b3b118e357f077.jpg",
      },
      {
        text: "4 cups all-purpose flour",
        quantity: 4,
        measure: "cup",
        food: "all-purpose flour",
        weight: 500,
        foodCategory: "grains",
        foodId: "food_ar3x97tbq9o9p6b6gzwj0am0c81l",
        image:
          "https://www.edamam.com/food-img/368/368077bbcab62f862a8c766a56ea5dd1.jpg",
      },
      {
        text: "1 tablespoon baking powder",
        quantity: 1,
        measure: "tablespoon",
        food: "baking powder",
        weight: 13.799999999066733,
        foodCategory: "condiments and sauces",
        foodId: "food_bad4zycbt4w60dbut111vaub2g3e",
        image:
          "https://www.edamam.com/food-img/a84/a8410ec57a2e62a1ad9955ac14d40af6.jpg",
      },
      {
        text: "1 teaspoon vanilla extract",
        quantity: 1,
        measure: "teaspoon",
        food: "vanilla extract",
        weight: 4.2,
        foodCategory: "Condiments and sauces",
        foodId: "food_bh1wvnqaw3q7ciascfoygaabax2a",
        image:
          "https://www.edamam.com/food-img/90f/90f910b0bf82750d4f6528263e014cca.jpg",
      },
      {
        text: "Zest of 1 small lemon",
        quantity: 1,
        measure: "<unit>",
        food: "lemon",
        weight: 63,
        foodCategory: "fruit",
        foodId: "food_a6uzc62astrxcgbtzyq59b6fncrr",
        image:
          "https://www.edamam.com/food-img/70a/70acba3d4c734d7c70ef4efeed85dc8f.jpg",
      },
      {
        text: "1 cup milk",
        quantity: 1,
        measure: "cup",
        food: "milk",
        weight: 244,
        foodCategory: "Milk",
        foodId: "food_b49rs1kaw0jktabzkg2vvanvvsis",
        image:
          "https://www.edamam.com/food-img/7c9/7c9962acf83654a8d98ea6a2ade93735.jpg",
      },
      {
        text: "2 cups sesame seeds",
        quantity: 2,
        measure: "cup",
        food: "sesame seeds",
        weight: 288,
        foodCategory: "plant-based protein",
        foodId: "food_bvxfnx8bwz2q3abs04kd6bbuf9w8",
        image:
          "https://www.edamam.com/food-img/291/291b355a7a0948716243164427697279.jpg",
      },
    ],
  },
  {
    recipeName: "Strawberry and Wild Rice Tartlets",
    recipeID: 3,
    url: "https://www.epicurious.com/recipes/food/views/ba-syn-strawberry-wild-rice-tartlets",
    ingredients: [
      {
        text: "Vegetable oil (for pan)",
        quantity: 0,
        measure: null,
        food: "Vegetable oil",
        weight: 11.459884348,
        foodCategory: "Oils",
        foodId: "food_bt1mzi2ah2sfg8bv7no1qai83w8s",
        image:
          "https://www.edamam.com/food-img/6e5/6e51a63a6300a8ea1b4c4cc68dfaba33.jpg",
      },
      {
        text: "Kosher salt",
        quantity: 0,
        measure: null,
        food: "Kosher salt",
        weight: 5.05583133,
        foodCategory: "Condiments and sauces",
        foodId: "food_a1vgrj1bs8rd1majvmd9ubz8ttkg",
        image:
          "https://www.edamam.com/food-img/694/6943ea510918c6025795e8dc6e6eaaeb.jpg",
      },
      {
        text: "1 cup wild rice",
        quantity: 1,
        measure: "cup",
        food: "wild rice",
        weight: 160,
        foodCategory: "grains",
        foodId: "food_at0h9hean2v4bobxbjzvgbhm51h7",
        image:
          "https://www.edamam.com/food-img/1bc/1bcfd41e4d9869c95647b8040069408c.jpg",
      },
      {
        text: "8 oz. dried tart cherries",
        quantity: 8,
        measure: "ounce",
        food: "tart cherries",
        weight: 226.796185,
        foodCategory: "fruit",
        foodId: "food_b7r68adakprkpxa1rd3rtb33wvaj",
        image:
          "https://www.edamam.com/food-img/553/553b626901dcbde9a74ee66c85f459bc.jpg",
      },
      {
        text: "1 lb. strawberries, hulled, plus halved strawberries for serving",
        quantity: 1,
        measure: "pound",
        food: "strawberries",
        weight: 453.59237,
        foodCategory: "fruit",
        foodId: "food_b4s2ibkbrrucmbabbaxhfau8ay42",
        image:
          "https://www.edamam.com/food-img/00c/00c8851e401bf7975be7f73499b4b573.jpg",
      },
      {
        text: "Small mint leaves (for serving)",
        quantity: 1,
        measure: "serving",
        food: "mint leaves",
        weight: 2.25,
        foodCategory: "Condiments and sauces",
        foodId: "food_bxl4xoga4owdkeay51sy8anesxj5",
        image:
          "https://www.edamam.com/food-img/7f0/7f01cc4f71c5c6ad31051ed74b9c058b.jpg",
      },
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
    global.fetch = jest.fn();

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
        ingredients: SAMPLE_RECIPE.ingredients,
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
  });

  // Mocked behavior: fetch response with 401 status
  // Input: valid tripID and route with no stops in db
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Missing API key", async () => {
    const originalApiKey = process.env.EDAMAM_API_KEY;
    const originalAppId = process.env.EDAMAM_APP_ID;
    delete process.env.EDAMAM_APP_ID;
    delete process.env.EDAMAM_API_KEY;

    // mock db to return a valid route
    const mockCollection: Partial<Collection> = {
      findOne: jest.fn().mockResolvedValue(MOCK_ROUTE),
    };
    const mockDb: Partial<Db> = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };
    jest.spyOn(MongoClient.prototype, "db").mockReturnValue(mockDb as Db);

    const response = await request(app)
      .post("/recipes")
      .send({ tripID: new ObjectId().toHexString() })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(MongoClient.prototype.db).toHaveBeenCalled();

    process.env.EDAMAM_API_KEY = originalApiKey;
    process.env.EDAMAM_APP_ID = originalAppId;
  });

  /// Mocked behavior: fetch response with valid recipe but missing recipeName and uri
  // Input: valid tripID
  // Expected status code: 201
  // Expected behavior: recipe added to database
  // Expected output: recipe with empty recipeName and uri
  test("Response with empty recipeName and uri", async () => {
    // mock fetch to return a response with empty recipeName and recipeID = 0
    global.fetch = jest.fn().mockResolvedValue({
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
                ingredients: SAMPLE_RECIPE.ingredients,
              },
            },
          ],
        }),
    });

    // mock db to return a valid route
    const mockCollection: Partial<Collection> = {
      findOne: jest.fn().mockResolvedValue(MOCK_ROUTE),
      insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };
    const mockDb: Partial<Db> = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };
    jest.spyOn(MongoClient.prototype, "db").mockReturnValue(mockDb as Db);

    const response = await request(app)
      .post("/recipes")
      .send({ tripID: new ObjectId().toHexString() })
      .expect(201);

    // verify the returned recipe has empty recipeName and recipeID = 0
    expect(response.body).toEqual(
      Array(3).fill({
        recipeName: "",
        recipeID: 0,
        url: "http://example.com/recipe",
        ingredients: SAMPLE_RECIPE.ingredients,
      }),
    );
    expect(MongoClient.prototype.db).toHaveBeenCalled();
  });

  // Mocked behavior: fetchRecipe returns a valid recipe
  // Input: valid tripID
  // Expected status code: 201
  // Expected behavior: recipe added to database
  // Expected output: list of recipes
  test("Valid recipes returned", async () => {
    jest
      .spyOn(RecipeHelper, "createRecipesfromRoute")
      .mockResolvedValue(SAMPLE_RECIPES_LIST);

    const result = await client
      .db("route_data")
      .collection("routes")
      .insertOne(MOCK_ROUTE);

    const response = await request(app)
      .post("/recipes")
      .send({ tripID: result.insertedId.toHexString() })
      .expect(201);

    expect(RecipeHelper.createRecipesfromRoute).toHaveBeenCalled();
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
      "No recipes found for tripID",
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
    // Mock the database response
    jest
      .spyOn(RecipeHelper, "getRecipesFromDb")
      .mockResolvedValue(SAMPLE_RECIPES_LIST); // Return the `recipes` array

    const tripID = new ObjectId(123);

    // Make the request to the endpoint
    const response = await request(app)
      .get(`/recipes/${tripID.toHexString()}`)
      .expect(200);

    // Assertions
    expect(response.body).toEqual(SAMPLE_RECIPES_LIST);
    expect(RecipeHelper.getRecipesFromDb).toHaveBeenCalledWith(
      tripID.toHexString(),
    );
  });

  // Mocked behavior: in-memory db with valid recipe
  // Input: valid trip id with mocked valid recipe
  // Expected status code: 200
  // Expected behavior: recipe retrieved from db successfully
  // Expected output: recipe object
  test("Retrieve valid recipe from in-mem", async () => {
    const tripID = new ObjectId().toHexString();

    // setup: insert sample recipe into db
    const db = client.db(RECIPES_DB_NAME);
    const collection = db.collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME);
    await collection.insertOne({ tripID, recipes: SAMPLE_RECIPES_LIST });

    const response = await request(app).get(`/recipes/${tripID}`).expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body).toEqual(SAMPLE_RECIPES_LIST);

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
      recipes: SAMPLE_RECIPES_LIST, // Use the recipes array from SAMPLE_RECIPE
    };

    // Mock the database response
    jest
      .spyOn(RecipeHelper, "getRecipesFromDb")
      .mockResolvedValue(mockRecipeData.recipes); // Return the full object with `recipes` property

    const tripID = new ObjectId().toHexString();
    const response = await request(app).get(`/recipes/${tripID}`).expect(200);

    // Assertions
    expect(response.body).toEqual(SAMPLE_RECIPES_LIST);
    expect(RecipeHelper.getRecipesFromDb).toHaveBeenCalledWith(tripID);
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
      "No recipes found for tripID",
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
