
describe("Unmocked Performance test", () => {
    jest.setTimeout(20000); //20s

    // Justification: A user may decide to generate a route and recipes, but then decide to delete both
    // route and recipes if they find them unsatisfactory, which should possible to do quickly
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
      console.log("tripID: ",tripID);

      const recipe_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/recipes`,
        {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tripID: tripID.toString()
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
    const duration = end - start; //begin timing test assuming that operation succeeded
    console.log(`Route Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(2700); // 4s
  });

  // Justification: A store owner should be able to upload a discount, check that it is available,
  // and potentially delete it quickly.
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

    const get_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/discounts`,
      {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const get_data = await get_response.json();
    console.log('GET single discount:', get_data);
    

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
      const end = Date.now();
      const duration = end - start; //begin timing test assuming that operation succeeded
      console.log(`Discount Execution time: ${duration}ms`);
      expect(duration).toBeLessThanOrEqual(2700);
  });

  // Justification: A store owner should be able to upload multiple discounts, check that they are
  //  available, and delete any number of them quickly.
  test("Unmocked 10 discount", async () => {
    
    const start = Date.now();
    const discountID = [];
    for (let i =0 ; i < 10; i++){
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
            price: i
          }),
        }
      );
      const data = await discount_response.json();
      console.log("DIscount number ",i);
      const discountIDsingle = data.discountID;
      discountID.push(discountIDsingle);
    }
    const get_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/discounts`,
      {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    for(let i = 0; i < 10; i++){
      const did = discountID.pop();
      const discount_teardown = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/discounts/${did}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          }
        });
        if (!discount_teardown.ok) {
          throw new Error(`HTTP error! Status: ${discount_teardown.status}`);
        }
    }
    console.log('10 discount teardown successful');

    const get_data = await get_response.json();
    console.log('10 discount GET:', get_data);
    const end = Date.now();
    const duration = end - start; //begin timing test assuming that operation succeeded
    console.log(`10 discount Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(2700);
  });

  // Justification: Users should be able to subscribe, and potentially change their mind quickly
  test("Unmocked single notification", async () => {
    const userID = "real_person";
    const start = Date.now();
    const notif_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/notifications`,
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID,
          fcmToken: "Vancouver",
        }),
      }
    );
    const data = await notif_response.json();
    expect(data.message).toContain("Subscribed successfully");
    console.log(userID," has subscribed successfully");

    const notif_teardown = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/notifications/${userID}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (!notif_teardown.ok) {
        throw new Error(`notification delete error! Status: ${notif_teardown.status}`);
      }
      const end = Date.now();
      console.log('notif teardown successful');
      const duration = end - start; //begin timing test assuming that operation succeeded
      console.log(`notif Execution time: ${duration}ms`);
      expect(duration).toBeLessThanOrEqual(2700);
  });

  // Justification: Multiple users may subscribe and potentially change their minds, which should
  // not cause significant delays
  test("Unmocked 10 notification", async () => {
    const start = Date.now();
    for (let i = 0 ; i < 10; i++){
      const notif_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/notifications`,
        {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID: i.toString(),
            fcmToken: "Vancouver",
          }),
        }
      );
      const data = await notif_response.json();
    expect(data.message).toContain("Subscribed successfully");
    console.log(i," has subscribed successfully");
    }
    for (let i = 0; i < 10; i++){
      const notif_teardown = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/notifications/${i}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          }
        });
        if (!notif_teardown.ok) {
          throw new Error(`10 notification delete error! Status: ${notif_teardown.status}`);
        }
    }
    const end = Date.now();
      console.log('10 notif teardown successful');
      const duration = end - start; //begin timing test assuming that operation succeeded
      console.log(`10 notification Execution time: ${duration}ms`);
      expect(duration).toBeLessThanOrEqual(2700);
    });
    
    // Justification: Users should be able to add allergens, view them, and potentially delete them quickly
    test("Unmocked single allergy", async () => {
      const userID = "real_person";
      const allergen = "fake_people";
      const start = Date.now();
      const allergy_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/preferences/allergies/`,
        {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID,
            allergy: allergen,
          }),
        }
      );
      const data = await allergy_response.json();
      expect(data.message).toContain("Allergy added successfully")
      console.log(userID," added allergy ",allergen);
      const get_response = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/preferences/allergies/${userID}`,
        {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const get_data = await get_response.json();
      console.log('GET single allergy:', get_data);
      const end = Date.now();
      const allergy_teardown = await fetch(`https://xy47xwa9v8.execute-api.us-east-2.amazonaws.com/prod/preferences/allergies/${userID}/${allergen}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          }
        });
        if (!allergy_teardown.ok) {
          throw new Error(`allergy delete error! Status: ${allergy_teardown.status}`);
        }
        console.log('allergy teardown successful');
        const duration = end - start; //begin timing test assuming that operation succeeded
        console.log(`allergy Execution time: ${duration}ms`);
        expect(duration).toBeLessThanOrEqual(2700);
    });
});
  