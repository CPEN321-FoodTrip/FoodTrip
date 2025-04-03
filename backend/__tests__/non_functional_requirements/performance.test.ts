describe("Performance test", () => {
  const USER_ID = "abcdefghijklmnopqrstuvwxyz";
  const MAX_RESPONSE_TIME = 2000; // 2 seconds

  // Justification: A user may decide to generate a route and recipes, but then decide to delete both
  // route and recipes if they find them unsatisfactory, which should possible to do quickly
  test("Single route, 3 stops", async () => {
    // check route generate response time
    var start = Date.now();
    const route_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/routes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: USER_ID,
          origin: "Vancouver",
          destination: "Toronto",
          numStops: 3,
        }),
      }
    );
    var end = Date.now();

    if (route_response.ok) {
      var duration = end - start;
      console.debug(`Route Execution time: ${duration}ms`);
      expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

      const data = await route_response.json();
      const tripID = data.tripID;

      // check recipe generate response time
      start = Date.now();
      const recipe_response = await fetch(
        `${process.env.GATEWAY_BASE_URL}/recipes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tripID,
            userID: USER_ID,
          }),
        }
      );
      end = Date.now();
      duration = end - start;
      console.debug(`Recipe Execution time: ${duration}ms`);
      expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

      const recipe_data = await recipe_response.json();
      expect(recipe_data).not.toBeNull();

      // check route delete response time
      start = Date.now();
      const route_teardown = await fetch(
        `${process.env.GATEWAY_BASE_URL}/routes/${tripID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      end = Date.now();

      if (!route_teardown.ok) {
        throw new Error(`HTTP error! Status: ${route_teardown.status}`);
      }

      duration = end - start;
      console.debug(`Route Teardown Execution time: ${duration}ms`);
      expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

      // check recipe delete response time
      start = Date.now();
      const recipe_teardown = await fetch(
        `${process.env.GATEWAY_BASE_URL}/recipes/${tripID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      end = Date.now();
      if (!recipe_teardown.ok) {
        throw new Error(`HTTP error! Status: ${recipe_teardown.status}`);
      }

      duration = end - start;
      console.debug(`Recipe Teardown Execution time: ${duration}ms`);
      expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);
    } else {
      console.error("Request failed with status:", route_response.status);
    }
  });

  // Justification: A store owner should be able to upload a discount, check that it is available,
  // and potentially delete it quickly.
  test("Single discount", async () => {
    // check add discount response time
    var start = Date.now();
    const discount_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/discounts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeID: "test_store",
          storeName: "Test Store",
          ingredient: "Apple",
          price: 1,
        }),
      }
    );
    var end = Date.now();
    var duration = end - start;
    console.debug(`Add Discount Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

    const data = await discount_response.json();
    const discountID = data.discountID;

    // check get discount response time
    start = Date.now();
    const get_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/discounts`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    end = Date.now();
    duration = end - start;
    console.debug(`Get Discount Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

    expect(await get_response.json()).not.toBeNull();

    // check delete discount response time
    start = Date.now();
    const discount_teardown = await fetch(
      `${process.env.GATEWAY_BASE_URL}/discounts/${discountID}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    end = Date.now();
    if (!discount_teardown.ok) {
      throw new Error(`HTTP error! Status: ${discount_teardown.status}`);
    }
    duration = end - start;
    console.debug(`Delete Discount Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);
  });

  // Justification: A store owner should be able to upload multiple discounts, check that they are
  //  available, and delete any number of them quickly.
  test("10 discount", async () => {
    const addResponseTimes = [];
    const discountIDs = [];

    // check add discount response time on average over 10 iterations
    for (let i = 0; i < 10; i++) {
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
            storeName: "Test Store",
            ingredient: "Apple",
            price: i,
          }),
        }
      );
      const end = Date.now();
      const duration = end - start;
      addResponseTimes.push(duration);

      const data = await discount_response.json();
      const discountIDsingle = data.discountID;
      discountIDs.push(discountIDsingle);
    }
    const totalAddResponseTime = addResponseTimes.reduce(
      (acc, time) => acc + time,
      0
    );
    console.debug(
      `Add 10 Discounts Average Execution time: ${totalAddResponseTime / 10}ms`
    );
    expect(totalAddResponseTime / 10).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

    // check get all discounts response time
    var start = Date.now();
    const get_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/discounts`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    var end = Date.now();

    if (!get_response.ok) {
      throw new Error(`HTTP error! Status: ${get_response.status}`);
    }

    var duration = end - start;
    console.debug(`Get All Discounts Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

    // check delete discount response time on average over 10 iterations
    const delResponseTimes = [];
    for (let i = 0; i < 10; i++) {
      const discountID = discountIDs.pop();

      start = Date.now();
      const discount_teardown = await fetch(
        `${process.env.GATEWAY_BASE_URL}/discounts/${discountID}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      end = Date.now();

      if (!discount_teardown.ok) {
        throw new Error(`HTTP error! Status: ${discount_teardown.status}`);
      }

      duration = end - start;
      delResponseTimes.push(duration);
    }

    const totalDelResponseTime = delResponseTimes.reduce(
      (acc, time) => acc + time,
      0
    );
    console.debug(
      `Delete 10 Discounts Average Execution time: ${
        totalDelResponseTime / 10
      }ms`
    );
    expect(totalDelResponseTime / 10).toBeLessThanOrEqual(MAX_RESPONSE_TIME);
  });

  // Justification: Users should be able to subscribe, and potentially change their mind quickly
  test("Single notification", async () => {
    // check add notification token response time
    var start = Date.now();
    const notif_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/notifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: USER_ID,
          fcmToken: "Vancouver",
        }),
      }
    );
    var end = Date.now();
    var duration = end - start;
    console.debug(`Add Notification Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

    const data = await notif_response.json();
    expect(data.message).toContain("Subscribed successfully");

    // check delete notification token response time
    start = Date.now();
    const notif_teardown = await fetch(
      `${process.env.GATEWAY_BASE_URL}/notifications/${USER_ID}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    end = Date.now();

    if (!notif_teardown.ok) {
      throw new Error(
        `notification delete error! Status: ${notif_teardown.status}`
      );
    }

    duration = end - start;
    console.debug(`Delete Notification Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);
  });

  // Justification: Multiple users may subscribe and potentially change their minds, which should
  // not cause significant delays
  test("10 notification", async () => {
    // check add notification token response time on average over 10 iterations
    const addResponseTimes = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      const notif_response = await fetch(
        `${process.env.GATEWAY_BASE_URL}/notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID: i.toString(),
            fcmToken: "fake_token",
          }),
        }
      );
      const end = Date.now();
      const duration = end - start;
      addResponseTimes.push(duration);

      const data = await notif_response.json();
      expect(data.message).toContain("Subscribed successfully");
    }
    const totalAddResponseTime = addResponseTimes.reduce(
      (acc, time) => acc + time,
      0
    );
    console.debug(
      `Add 10 Notifications Average Execution time: ${
        totalAddResponseTime / 10
      }ms`
    );
    expect(totalAddResponseTime / 10).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

    // check delete notification token response time on average over 10 iterations
    const delResponseTimes = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      const notif_teardown = await fetch(
        `${process.env.GATEWAY_BASE_URL}/notifications/${i}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const end = Date.now();

      if (!notif_teardown.ok) {
        throw new Error(
          `10 notification delete error! Status: ${notif_teardown.status}`
        );
      }

      const duration = end - start;
      delResponseTimes.push(duration);
    }
    const totalDelResponseTime = delResponseTimes.reduce(
      (acc, time) => acc + time,
      0
    );
    console.debug(
      `Delete 10 Notifications Average Execution time: ${
        totalDelResponseTime / 10
      }ms`
    );
    expect(totalDelResponseTime / 10).toBeLessThanOrEqual(MAX_RESPONSE_TIME);
  });

  // Justification: Users should be able to add allergens, view them, and potentially delete them quickly
  test("Single allergy", async () => {
    const allergen = "fake_allergen";

    // check add allergy response time
    var start = Date.now();
    const allergy_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/preferences/allergies/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: USER_ID,
          allergy: allergen,
        }),
      }
    );
    var end = Date.now();
    var duration = end - start;
    console.debug(`Add Allergy Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

    const data = await allergy_response.json();
    expect(data.message).toContain("Allergy added successfully");

    // check get allergy response time
    start = Date.now();
    const get_response = await fetch(
      `${process.env.GATEWAY_BASE_URL}/preferences/allergies/${USER_ID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    end = Date.now();
    duration = end - start;
    console.debug(`Get Allergy Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);

    expect(await get_response.json()).not.toBeNull();

    // check delete allergy response time
    start = Date.now();
    const allergy_teardown = await fetch(
      `${process.env.GATEWAY_BASE_URL}/preferences/allergies/${USER_ID}/${allergen}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    end = Date.now();

    if (!allergy_teardown.ok) {
      throw new Error(
        `allergy delete error! Status: ${allergy_teardown.status}`
      );
    }

    duration = end - start;
    console.debug(`Delete Allergy Execution time: ${duration}ms`);
    expect(duration).toBeLessThanOrEqual(MAX_RESPONSE_TIME);
  });
});
