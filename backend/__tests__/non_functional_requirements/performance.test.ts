import request from "supertest";
import app from "../../index";
import * as RouteHelpers from "../../helpers/RouteHelpers";
import * as RecipeHelper from "../../helpers/RecipeHelper";
import { ObjectId } from "mongodb";
import { client } from "../../services";

const ROUTES_DB_NAME = "route_data";
const ROUTES_COLLECTION_NAME = "routes";
const RECIPE_DB_NAME = "recipes";
const RECIPE_COLLECTION_NAME = "recipes";

const SAMPLE_ROUTE_1 = {
    start_location: {
          name: "Vancouver",
          latitude: 49.2608724,
          longitude: -123.113952,
      
    },
    end_location: {
      name: "Toronto",
      latitude: 43.6534817,
      longitude: -79.3839347,
    },
    stops: [
      {
        location: {
          name: "Winnipeg",
          latitude: 49.8844,
          longitude: -97.14704,
          population: 749607,
        },
        distanceFromStart: 1329.071074459746,
        cumulativeDistance: 1329.071074459746,
        segmentPercentage: 50,
      },
    ],
  };
  
  const SAMPLE_RECIPE_1 = [
      {
        recipeName: "The Vancouver Recipe",
        recipeID: 29,
        url: "https://www.seriouseats.com/the-vancouver-cocktail-recipe",
        ingredients: [
            "2 ounces gin",
            "1/2 ounce sweet vermouth",
            "1 teaspoon Benedictine",
            "1-2 dashes orange bitters, to taste",
            "Thin strip of lemon peel, for garnish"
        ]
    },
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
            "salt & pepper"
          ]
      },
      {
        recipeName: "Toronto Cocktail Recipe",
        recipeID: 10,
        url: "http://www.seriouseats.com/recipes/2008/10/toronto-cocktail-recipe.html",
        ingredients: [
            "2 ounces rye whiskey",
            "1/4 ounce Fernet Branca",
            "1/4 ounce simple syrup",
            "2 dashes Angostura bitters"
        ]
    }
    ]
  


// jest.mock("node-fetch", () => jest.fn());

describe("Unmocked Performance test", () => {
    jest.setTimeout(20000); //20s
  beforeEach(async () => {
    await RouteHelpers.initializeGeoNamesDatabase();
  });

  test("Unmocked single route, 3 stops", async () => {
    const start = Date.now();
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
    const collection = db.collection(ROUTES_COLLECTION_NAME);
    const tripID = route_response.body.tripID;
    console.log(tripID);
    const result = await collection.findOne({ _id: new ObjectId(tripID) });

    const recipe_response = await request(app)
      .post("/recipes")
      .send({
        tripID 
      })
      .expect(200);

    const recipe_db = client.db(RECIPE_DB_NAME);
    const recipe_collection = recipe_db.collection(RECIPE_COLLECTION_NAME);
    const recipe_result = await recipe_collection.findOne({ _id: tripID }); 

    const end = Date.now();

      // route response verification
    expect(route_response.body).toHaveProperty("tripID");
    expect(route_response.body).toHaveProperty("start_location");
    expect(route_response.body).toHaveProperty("end_location");
    expect(Array.isArray(route_response.body.stops)).toBe(true);
    expect(route_response.body.stops).toHaveLength(1); // 1 stop
      // route db verification
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("userID", "test-user");
    expect(result?.start_location).toHaveProperty("name", "Vancouver");
    expect(result?.end_location).toHaveProperty("name", "Toronto");
    expect(Array.isArray(result?.stops)).toBe(true);
    expect(result?.stops).toHaveLength(1); // 1 stop


    // recipe response verification
    expect(recipe_response).not.toBeNull();
    expect(Array.isArray(recipe_response?.body)).toBe(true);
    // console.log(recipe_response.body);
    expect(recipe_response.body).toHaveLength(3);
    expect(recipe_response.body).toEqual(SAMPLE_RECIPE_1);
    
      // recipe db verification
    console.log(recipe_result?.body);
    // expect(Array.isArray(recipe_result?.body)).toBe(true);
    expect(recipe_result?.body[0]).toEqual(SAMPLE_RECIPE_1[0]);
    // expect(recipe_result?.body.recipes[0]).toHaveProperty("recipeID", 1);
    // expect(recipe_result?.body.recipes[0]).toHaveProperty("url", "http://www.food.com/recipe/winnipeg-chicken-curry-2930");
    // expect(recipe_result?.body.recipes[0]).toHaveProperty("ingredients", SAMPLE_RECIPE_1);
    // expect(recipe_result?.body.recipes).toHaveLength(10); 

    const duration = end - start; //begin timing test assuming that operation succeeded

    const route_teardown = await request(app).delete(`/routes/${tripID}`).expect(200);
    expect(route_teardown.body).toHaveProperty("success", true);
    const recipe_teardown = await request(app).delete(`/recipes/${tripID}`).expect(200);
    expect(recipe_teardown.body).toHaveProperty("success", true);

    console.log(`unmocked Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(4000); // 4s
  });

//   test("Unmocked single route, 10 stops", async () => {
//     const start = Date.now();
//     const response = await request(app)
//       .post("/routes")
//       .send({
//         userID: "test-user",
//         origin: "Vancouver",
//         destination: "Toronto",
//         numStops: 10,
//       })
//       .expect(201);

    
//     const db = client.db(ROUTES_DB_NAME);
//     const collection = db.collection(ROUTES_COLLECTION_NAME);
//     const tripID = response.body.tripID;
//     const result = await collection.findOne({ _id: new ObjectId(tripID) });

//     const recipe_response = await request(app)
//       .post("/recipes")
//       .send({
//         tripID: tripID 
//       })
//       .expect(200);

//     const recipe_db = client.db(RECIPE_DB_NAME);
//     const recipe_collection = recipe_db.collection(RECIPE_COLLECTION_NAME);
//     const recipe_result = await recipe_collection.findOne({ _id: tripID }); 

    

//       // route response verification
//     expect(response.body).toHaveProperty("tripID");
//     expect(response.body).toHaveProperty("start_location");
//     expect(response.body).toHaveProperty("end_location");
//     expect(Array.isArray(response.body.stops)).toBe(true);
//     expect(response.body.stops).toHaveLength(10); // 10 stops
//       // route db verification
//     expect(result).not.toBeNull();
//     expect(result).toHaveProperty("userID", "test-user");
//     expect(result?.start_location).toHaveProperty("name", "Vancouver");
//     expect(result?.end_location).toHaveProperty("name", "Toronto");
//     expect(Array.isArray(result?.stops)).toBe(true);
//     expect(result?.stops).toHaveLength(10); // 1 stop


//     // recipe response verification
//     expect(recipe_result).not.toBeNull();
//     expect(Array.isArray(recipe_result?.body)).toBe(true);
//     expect(recipe_result?.body.recipes[0]).toHaveProperty("recipeName");
//     expect(recipe_result?.body.recipes[0]).toHaveProperty("recipeID");   
//     expect(recipe_result?.body.recipes[0]).toHaveProperty("url");   
//     expect(recipe_result?.body.recipes[0]).toHaveProperty("ingredients");   
//     expect(recipe_result?.body.recipes).toHaveLength(1);
//       // recipe db verification

//     expect(result?.body.recipes[0]).toHaveProperty("recipeName", "Winnipeg Chicken Curry");
//     expect(result?.body.recipes[0]).toHaveProperty("recipeID", 1);
//     expect(result?.body.recipes[0]).toHaveProperty("url", "http://www.food.com/recipe/winnipeg-chicken-curry-2930");
//     expect(result?.body.recipes[0]).toHaveProperty("ingredients", SAMPLE_RECIPE_1.recipes[0].ingredients);
//     expect(Array.isArray(result?.stops)).toBe(true);
//     expect(result).toHaveLength(10); 
//     const end = Date.now();

//     const duration = end - start; //begin timing test assuming that operation succeeded
//     console.log(`unmocked Execution time: ${duration}ms`);
//     expect(duration).toBeLessThanOrEqual(2000); // 2s
//   });
});
  