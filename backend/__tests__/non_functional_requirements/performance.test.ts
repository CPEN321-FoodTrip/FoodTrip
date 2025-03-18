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
  // beforeEach(async () => {
  //   await RouteHelpers.initializeGeoNamesDatabase();
  // });

  test("Unmocked single route, 3 stops", async () => {
    
    const start = Date.now();
    const route_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/routes`,
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: "test_person3",
          origin: "Vancouver",
          destination: "Toronto",
          numStops: 1
        }),
      }
    );

    if (route_response.ok) {
      const data = await route_response.json();
      console.log('Route:', data);
      const tripID = data.tripID;
      console.log(tripID);

      const recipe_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/recipes`,
        {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tripID: tripID
          }),
        }
      );

      const recipedata = await recipe_response.json();
      console.log('Recipe:', recipedata);

      const route_teardown = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/routes/${tripID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          }
        });
        if (!route_teardown.ok) {
          throw new Error(`HTTP error! Status: ${route_teardown.status}`);
        }
        // const tdata = await route_teardown.json();
        console.log('route teardown successful');

        const recipe_teardown = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/recipes/${tripID}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            }
          });
          if (!recipe_teardown.ok) {
            throw new Error(`HTTP error! Status: ${recipe_teardown.status}`);
          }
          console.log('recipe teardown successful');

    } else {
      console.error('Request failed with status:', route_response.status);
    }

    const end = Date.now();

      // route response verification
    // expect(route_response.body).toHaveProperty("tripID");
    // expect(route_response.body).toHaveProperty("start_location");
    // expect(route_response.body).toHaveProperty("end_location");
    // expect(Array.isArray(route_response.body.stops)).toBe(true);
    // expect(route_response.body.stops).toHaveLength(1); // 1 stop
    //   // route db verification
    // expect(result).not.toBeNull();
    // expect(result).toHaveProperty("userID", "test-user");
    // expect(result?.start_location).toHaveProperty("name", "Vancouver");
    // expect(result?.end_location).toHaveProperty("name", "Toronto");
    // expect(Array.isArray(result?.stops)).toBe(true);
    // expect(result?.stops).toHaveLength(1); // 1 stop


    // recipe response verification
    // expect(recipe_response).not.toBeNull();
    // expect(Array.isArray(recipe_response?.body)).toBe(true);
    // console.log(recipe_response.body);
    // expect(recipe_response.body).toHaveLength(3);
    // expect(recipe_response.body).toEqual(SAMPLE_RECIPE_1);
    
      // recipe db verification
    // console.log(recipe_result?.body);
    // expect(Array.isArray(recipe_result?.body)).toBe(true);
    // expect(recipe_result?.body[0]).toEqual(SAMPLE_RECIPE_1[0]);
    // expect(recipe_result?.body.recipes[0]).toHaveProperty("recipeID", 1);
    // expect(recipe_result?.body.recipes[0]).toHaveProperty("url", "http://www.food.com/recipe/winnipeg-chicken-curry-2930");
    // expect(recipe_result?.body.recipes[0]).toHaveProperty("ingredients", SAMPLE_RECIPE_1);
    // expect(recipe_result?.body.recipes).toHaveLength(10); 

    const duration = end - start; //begin timing test assuming that operation succeeded
    console.log(`unmocked Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(4000); // 4s
  });

  test("Unmocked single discount", async () => {
    
    const start = Date.now();
    const discount_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/discounts`,
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeID: "test_store",
          storeName: "Vancouver",
          ingredient: "Toronto, the entire province",
          price: 1
        }),
      }
    );
    
    const data = await discount_response.json();
    console.log('discount:', data);
    const discountID = data.discountID;
    console.log(discountID);

    const get_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/discounts`,
      {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const get_data = await get_response.json();
    console.log('GET:', get_data);
    const end = Date.now();

    const discount_teardown = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/discounts/${discountID}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (!discount_teardown.ok) {
        throw new Error(`HTTP error! Status: ${discount_teardown.status}`);
      }
      console.log('discount teardown successful');
      const duration = end - start; //begin timing test assuming that operation succeeded
      console.log(`unmocked Execution time: ${duration}ms`);
      expect(duration).toBeLessThanOrEqual(4000);
  });
});
  