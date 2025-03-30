describe("Unmocked Performance test", () => {
  beforeAll(async () => {
    jest.setTimeout(20000); //20s
    // sleep 2 seconds to allow proper setup
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  // Justification: A user may decide to generate a route and recipes, but then decide to delete both
  // route and recipes if they find them unsatisfactory, which should possible to do quickly
  test("Unmocked single route, 3 stops", async () => {
    const start = Date.now();
    const route_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/routes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: "test_person3",
          origin: "Vancouver",
          destination: "Toronto",
          numStops: 1,
        }),
      },
    );

    if (route_response.ok) {
      const data = await route_response.json();
      const tripID = data.tripID;

      const recipe_response = await fetch(
        `${process.env.GATEWAY_BASE_URL}/recipes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tripID,
          }),
        },
      );

      const recipe_data = await recipe_response.json();
      expect(recipe_data).not.toBeNull();

      const route_teardown = await fetch(
        `${process.env.GATEWAY_BASE_URL}/routes/${tripID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!route_teardown.ok) {
        throw new Error(`HTTP error! Status: ${route_teardown.status}`);
      }

      const recipe_teardown = await fetch(
        `${process.env.GATEWAY_BASE_URL}/recipes/${tripID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!recipe_teardown.ok) {
        throw new Error(`HTTP error! Status: ${recipe_teardown.status}`);
      }
    } else {
      console.error("Request failed with status:", route_response.status);
    }

    const end = Date.now();
    const duration = end - start; //begin timing test assuming that operation succeeded
    console.debug(`Route Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(3000); // 3s
  });

  // Justification: A store owner should be able to upload a discount, check that it is available,
  // and potentially delete it quickly.
  test("Unmocked single discount", async () => {
    const start = Date.now();
    const discount_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/discounts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeID: "test_store",
          storeName: "Vancouver",
          ingredient: "Toronto, the entire province",
          price: 1,
        }),
      },
    );

    const data = await discount_response.json();
    const discountID = data.discountID;

    const get_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/discounts`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    expect(await get_response.json()).not.toBeNull();

    const discount_teardown = await fetch(
      `${process.env.GATEWAY_BASE_URL}/discounts/${discountID}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!discount_teardown.ok) {
      throw new Error(`HTTP error! Status: ${discount_teardown.status}`);
    }
    const end = Date.now();
    const duration = end - start; //begin timing test assuming that operation succeeded
    console.debug(`Discount Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(3000); // 3s
  });

  // Justification: A store owner should be able to upload multiple discounts, check that they are
  //  available, and delete any number of them quickly.
  test("Unmocked 10 discount", async () => {
    const start = Date.now();
    const discountID = [];
    for (let i = 0; i < 10; i++) {
      const discount_response = await fetch(
        `${process.env.GATEWAY_BASE_URL}/discounts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeID: "test_store",
            storeName: "Vancouver",
            ingredient: "Toronto, the entire province",
            price: i,
          }),
        },
      );
      const data = await discount_response.json();
      const discountIDsingle = data.discountID;
      discountID.push(discountIDsingle);
    }
    const get_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/discounts`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    for (let i = 0; i < 10; i++) {
      const did = discountID.pop();
      const discount_teardown = await fetch(
        `${process.env.GATEWAY_BASE_URL}/discounts/${did}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!discount_teardown.ok) {
        throw new Error(`HTTP error! Status: ${discount_teardown.status}`);
      }
    }

    expect(await get_response.json()).toHaveLength(10); // assumes db was empty

    const end = Date.now();
    const duration = end - start; //begin timing test assuming that operation succeeded
    console.debug(`10 discount Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(3000); // 3s
  });

  // Justification: Users should be able to subscribe, and potentially change their mind quickly
  test("Unmocked single notification", async () => {
    const userID = "real_person";
    const start = Date.now();
    const notif_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID,
          fcmToken: "Vancouver",
        }),
      },
    );
    const data = await notif_response.json();
    expect(data.message).toContain("Subscribed successfully");

    const notif_teardown = await fetch(
      `${process.env.GATEWAY_BASE_URL}/notifications/${userID}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!notif_teardown.ok) {
      throw new Error(
        `notification delete error! Status: ${notif_teardown.status}`,
      );
    }
    const end = Date.now();
    const duration = end - start; //begin timing test assuming that operation succeeded
    console.debug(`notif Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(3000); // 3s
  });

  // Justification: Multiple users may subscribe and potentially change their minds, which should
  // not cause significant delays
  test("Unmocked 10 notification", async () => {
    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      const notif_response = await fetch(
        `${process.env.GATEWAY_BASE_URL}/notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID: i.toString(),
            fcmToken: "Vancouver",
          }),
        },
      );
      const data = await notif_response.json();
      expect(data.message).toContain("Subscribed successfully");
    }
    for (let i = 0; i < 10; i++) {
      const notif_teardown = await fetch(
        `${process.env.GATEWAY_BASE_URL}/notifications/${i}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!notif_teardown.ok) {
        throw new Error(
          `10 notification delete error! Status: ${notif_teardown.status}`,
        );
      }
    }
    const end = Date.now();
    const duration = end - start; //begin timing test assuming that operation succeeded
    console.debug(`10 notification Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(3000); // 3s
  });

  // Justification: Users should be able to add allergens, view them, and potentially delete them quickly
  test("Unmocked single allergy", async () => {
    const userID = "real_person";
    const allergen = "fake_people";
    const start = Date.now();
    const allergy_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/preferences/allergies/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID,
          allergy: allergen,
        }),
      },
    );
    const data = await allergy_response.json();
    expect(data.message).toContain("Allergy added successfully");
    const get_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/preferences/allergies/${userID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    expect(await get_response.json()).not.toBeNull();
    const end = Date.now();
    const allergy_teardown = await fetch(
      `${process.env.GATEWAY_BASE_URL}/preferences/allergies/${userID}/${allergen}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (!allergy_teardown.ok) {
      throw new Error(
        `allergy delete error! Status: ${allergy_teardown.status}`,
      );
    }
    const duration = end - start; //begin timing test assuming that operation succeeded
    console.debug(`allergy Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(3000); // 3s
  });
});
