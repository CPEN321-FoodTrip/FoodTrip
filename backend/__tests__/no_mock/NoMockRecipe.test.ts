import request from "supertest";
import app from "../../index";
import { client } from "../../services";
import { ObjectId } from "mongodb";
import { RecipeDBEntry } from "../../interfaces/RecipeInterfaces";
import { RouteDBEntry } from "../../interfaces/RouteInterfaces";

// constants for routes saved in MongoDB
const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";

// constants for recipes saved in MongoDB
const RECIPE_DB_NAME = "recipes";
const RECIPE_COLLECTION_NAME = "recipes";

const SAMPLE_ROUTE = {
  userID: "test-user",
  route: {
    start_location: {
      name: "Vancouver",
      latitude: 49.2608724,
      longitude: -123.113952,
      population: 631486,
    },
    end_location: {
      name: "Toronto",
      latitude: 43.6534817,
      longitude: -79.3839347,
      population: 2731571,
    },
    stops: [
      {
        location: {
          name: "Regina",
          latitude: 50.45008,
          longitude: -104.6178,
          population: 176183,
        },
        distanceFromStart: 1329.071074459746,
        cumulativeDistance: 1329.071074459746,
        segmentPercentage: 33.33333333333333,
      },
      {
        location: {
          name: "Minneapolis",
          latitude: 44.97997,
          longitude: -93.26384,
          population: 410939,
        },
        distanceFromStart: 2292.312851021066,
        cumulativeDistance: 2292.312851021066,
        segmentPercentage: 66.66666666666666,
      },
    ],
  },
};

const SAMPLE_RECIPE = {
  tripID: new ObjectId().toHexString(),
  recipes: [
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
  ],
};

// Interface POST /recipes
describe("Unmocked: POST /recipes", () => {
  // Input: string tripID of a route that has already been created and stored in route DB and userID
  // Expected status code: 201
  // Expected behavior: recipes are successfully generated and saved in db
  // Expected output: object with tripID and array of recipes objects. recipes contain recipeName,
  // recipeID, url, and string array of ingredients
  test("Generate recipes for valid route", async () => {
    // setup: insert sample route into db
    const route_db = client.db(ROUTES_DB_NAME);
    const route_collection = route_db.collection<RouteDBEntry>(
      ROUTES_COLLECTION_NAME,
    );
    const route_result = await route_collection.insertOne(SAMPLE_ROUTE);
    const tripID = route_result.insertedId.toHexString();
    const response = await request(app)
      .post("/recipes")
      .send({
        tripID,
        userID: "test-user",
      })
      .expect(201);

    // response verification
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty("recipeName");
    expect(response.body[0]).toHaveProperty("recipeID");
    expect(response.body[0]).toHaveProperty("url");
    expect(response.body[0]).toHaveProperty("ingredients");
    expect(response.body).toHaveLength(4); // start, end, and 2 stops

    // db verification
    const db = client.db(RECIPE_DB_NAME);
    const collection = db.collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME);
    const result = await collection.findOne({ tripID });

    expect(result).not.toBeNull();
    expect(Array.isArray(result?.recipes)).toBe(true);
    expect(result?.recipes).toHaveLength(4); // start, end, and 2 stops

    // second recipe should be for Winnipeg Chicken Curry
    expect(result?.recipes[1]).toHaveProperty("recipeName", "Biscotti Regina");
    expect(result?.recipes[1]).toHaveProperty("recipeID", 113);
    expect(result?.recipes[1]).toHaveProperty(
      "url",
      "https://www.foodnetwork.com/recipes/biscotti-regina-3608012",
    );
    expect(result?.recipes[1]).toHaveProperty(
      "ingredients",
      SAMPLE_RECIPE.recipes[0].ingredients,
    );
  });

  // Input: missing body parameters (tripID and userID)
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating missing parameters
  test("Missing body parameters", async () => {
    const dbCountBefore = await client
      .db(RECIPE_DB_NAME)
      .collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app).post("/recipes").send({}).expect(400);

    // error should mention parameters missing
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("tripID"),
      ),
    ).toBe(true);
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("userID"),
      ),
    ).toBe(true);

    // verify db unchaged
    const dbCountAfter = await client
      .db(RECIPE_DB_NAME)
      .collection(RECIPE_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input: Malformed parameter (tripID is not an ObjectId) and valid userID
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating invalid tripID
  test("Malformed tripID", async () => {
    const dbCountBefore = await client
      .db(RECIPE_DB_NAME)
      .collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: "123", // tripID should be an ObjectId
        userID: "test-user",
      })
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Invalid tripID format");

    // verfify db unchaged
    const dbCountAfter = await client
      .db(RECIPE_DB_NAME)
      .collection(RECIPE_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input: tripID is not in the route database and valid userID
  // Expected status code: 404
  // Expected behavior: database is unchanged
  // Expected output: error message indicating route does not exist
  test("Nonexistant trip", async () => {
    const dbCountBefore = await client
      .db(RECIPE_DB_NAME)
      .collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: new ObjectId().toHexString(), // nonexistant tripID
        userID: "test-user",
      })
      .expect(404);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Trip not found");

    // verfify db unchaged
    const dbCountAfter = await client
      .db(RECIPE_DB_NAME)
      .collection(RECIPE_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input: tripID points to a route with no stops and valid userID
  // Expected status code: 500
  // Expected behavior: database is unchanged
  // Expected output: error message indicating internal issue
  test("Malformed route with no stops", async () => {
    // insert route with no stops
    const route_db = client.db(ROUTES_DB_NAME);
    const route_collection = route_db.collection<RouteDBEntry>(
      ROUTES_COLLECTION_NAME,
    );
    const route_result = await route_collection.insertOne({
      userID: "test-user",
      route: {
        start_location: {
          name: "Vancouver",
          latitude: 49.2608724,
          longitude: -123.113952,
          population: 631486,
        },
        end_location: {
          name: "Toronto",
          latitude: 43.6534817,
          longitude: -79.3839347,
          population: 2731571,
        },
        stops: [],
      },
    });

    const dbCountBefore = await client
      .db(RECIPE_DB_NAME)
      .collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: route_result.insertedId.toHexString(),
        userID: "test-user",
      })
      .expect(500);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("Internal server error");

    // verfify db unchaged
    const dbCountAfter = await client
      .db(RECIPE_DB_NAME)
      .collection(RECIPE_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });

  // Input: userID points to list of allergies and tripID points to a route with stops
  // Expected status code: 404
  // Expected behavior: database is unchanged
  // Expected output: error message indicating no recipes found
  test("Can't generate recipes that meet allergy restrictions", async () => {
    // insert allergies for user
    const allergy_db = client.db("preferences");
    const allergy_collection = allergy_db.collection("allergies");
    await allergy_collection.insertMany(
      ["nuts", "sesame", "eggs", "sugar", "salt", "flour", "Pineapple"].map(
        (allergy) => ({
          userID: "test-user",
          allergy,
        }),
      ),
    );

    // insert valid route
    const route_db = client.db(ROUTES_DB_NAME);
    const route_collection = route_db.collection<RouteDBEntry>(
      ROUTES_COLLECTION_NAME,
    );
    const route_result = await route_collection.insertOne(SAMPLE_ROUTE);

    const dbCountBefore = await client
      .db(RECIPE_DB_NAME)
      .collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/recipes")
      .send({
        tripID: route_result.insertedId.toHexString(),
        userID: "test-user",
      })
      .expect(404);

    expect(response.body).toHaveProperty(
      "error",
      "Could not find recipes that match user preferences",
    );

    // verfify db unchaged
    const dbCountAfter = await client
      .db(RECIPE_DB_NAME)
      .collection(RECIPE_COLLECTION_NAME)
      .countDocuments();

    expect(dbCountBefore).toBe(dbCountAfter);
  });
});

// Interface GET /recipes/:id
describe("Unmocked: GET /recipes/:id", () => {
  // Input: tripID belongs to a valid route
  // Expected status code: 200
  // Expected behavior: recipes for route successfully retrieved from db
  // Expected output: recipes object with recipeName, recipeID, url, and string array of ingredients
  test("Retrieve valid recipe", async () => {
    // setup: insert sample recipe into db
    const db = client.db(RECIPE_DB_NAME);
    const collection = db.collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME);
    await collection.insertOne(SAMPLE_RECIPE);

    const response = await request(app)
      .get(`/recipes/${SAMPLE_RECIPE.tripID}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty(
      "recipeName",
      SAMPLE_RECIPE.recipes[0].recipeName,
    );
    expect(response.body[0]).toHaveProperty(
      "recipeID",
      SAMPLE_RECIPE.recipes[0].recipeID,
    );
    expect(response.body[0]).toHaveProperty(
      "url",
      SAMPLE_RECIPE.recipes[0].url,
    );
    expect(response.body[0]).toHaveProperty(
      "ingredients",
      SAMPLE_RECIPE.recipes[0].ingredients,
    );
    expect(response.body).toEqual(SAMPLE_RECIPE.recipes);

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input: malformed url without tripID
  // Expected status code: 404
  // Expected behavior: no recipe is retrieved from db
  // Expected output: empty object
  test("Missing tripID", async () => {
    const response = await request(app).get("/recipes/").expect(404); // malformed url
    expect(response.body).toMatchObject({});
  });

  // Input: tripID with invalid format (not an ObjectId)
  // Expected status code: 400
  // Expected behavior: no recipe is retrieved from db
  // Expected output: error message indicating invalid tripID format
  test("Invalid tripID format", async () => {
    const tripID = "1234"; // tripID should be an ObjectId
    const response = await request(app).get(`/recipes/${tripID}`).expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");
  });

  // Input: tripID with nonexistant route
  // Expected status code: 404
  // Expected behavior: no recipe is retrieved from db
  // Expected output: error message indicating route not found
  test("Route not found (Empty db)", async () => {
    const tripID = new ObjectId().toHexString(); // nonexistant tripID
    const response = await request(app).get(`/recipes/${tripID}`).expect(404);
    expect(response.body).toHaveProperty(
      "error",
      "No recipes found for tripID",
    );
  });
});

// Interface DELETE /recipes/:id
describe("Unmocked: DELETE /recipes/:id", () => {
  // Input: tripID belongs to a valid route, which has a recipe
  // Expected status code: 200
  // Expected behavior: recipe is successfully deleted from db
  // Expected output: success message
  test("Valid deletion", async () => {
    // setup: insert sample recipe
    const db = client.db(RECIPE_DB_NAME);
    const collection = db.collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME);
    await collection.insertOne(SAMPLE_RECIPE);
    const originalCount = await collection.countDocuments();

    const response = await request(app)
      .delete(`/recipes/${SAMPLE_RECIPE.tripID}`)
      .expect(200);
    expect(response.body).toHaveProperty("success", true);

    // check db for deletion
    const findResult = await collection.findOne({
      _id: new ObjectId(SAMPLE_RECIPE.tripID),
    });
    expect(findResult).toBeNull();
    const newCount = await collection.countDocuments();
    expect(newCount).toBe(originalCount - 1);
  });

  // Input: malformed url without tripID
  // Expected status code: 404
  // Expected behavior: database is unchanged
  // Expected output: empty object
  test("Missing tripID", async () => {
    const db = client.db(RECIPE_DB_NAME);
    const collection = db.collection(RECIPE_COLLECTION_NAME);
    const originalCount = await collection.countDocuments();

    const response = await request(app).delete("/recipes/").expect(404); // malformed url
    expect(response.body).toMatchObject({});

    // verify nothing deleted in db
    const newCount = await collection.countDocuments();
    expect(newCount).toBe(originalCount);

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input: tripID with invalid format
  // Expected status code: 400
  // Expected behavior: database is unchanged
  // Expected output: error message indicating invalid tripID format
  test("Invalid tripID format", async () => {
    const db = client.db(RECIPE_DB_NAME);
    const collection = db.collection<RecipeDBEntry>(RECIPE_COLLECTION_NAME);
    const originalCount = await collection.countDocuments();

    const tripID = "1234"; // tripID should be a valid ObjectId
    const response = await request(app)
      .delete(`/recipes/${tripID}`)
      .expect(400);
    expect(response.body).toHaveProperty("error", "Invalid tripID format");

    // verify nothing deleted in db
    const newCount = await collection.countDocuments();
    expect(newCount).toBe(originalCount);
  });

  // Input: tripID with nonexistant route, or recipes have not been created for that route
  // Expected status code: 404
  // Expected behavior: database is unchanged
  // Expected output: error message indicating route not found
  test("Delete when no recipes made for route yet", async () => {
    // setup: insert sample route
    const route_db = client.db(ROUTES_DB_NAME);
    const route_collection = route_db.collection<RouteDBEntry>(
      ROUTES_COLLECTION_NAME,
    );
    const route_result = await route_collection.insertOne(SAMPLE_ROUTE);
    const tripID = route_result.insertedId.toHexString();

    const recipe_db = client.db(RECIPE_DB_NAME);
    const recipe_collection = recipe_db.collection<RecipeDBEntry>(
      RECIPE_COLLECTION_NAME,
    );
    const originalCount = await recipe_collection.countDocuments();

    const response = await request(app)
      .delete(`/recipes/${tripID}`)
      .expect(404);
    expect(response.body).toHaveProperty(
      "error",
      "No recipes found for tripID",
    );

    // check db to make sure nothing was deleted
    const findResult = await recipe_collection.findOne({
      _id: new ObjectId(tripID),
    });
    expect(findResult).toBeNull();
    const newCount = await recipe_collection.countDocuments();
    expect(newCount).toBe(originalCount);
  });

  // Input: empty db and nonexistant tripID
  // Expected status code: 404
  // Expected behavior: database is unchanged
  // Expected output: error message indicating route not found
  test("Delete on empty db", async () => {
    // no setup, no routes in db

    const tripID = new ObjectId().toHexString(); // nonexistant tripID
    const response = await request(app)
      .delete(`/recipes/${tripID}`)
      .expect(404);
    expect(response.body).toHaveProperty(
      "error",
      "No recipes found for tripID",
    );

    // check nothing in db
    const db = client.db(RECIPE_DB_NAME);
    const collection = db.collection(RECIPE_COLLECTION_NAME);
    const findResult = await collection.findOne({ _id: new ObjectId(tripID) });
    expect(findResult).toBeNull();
    const count = await collection.countDocuments();
    expect(count).toBe(0);
  });
});
