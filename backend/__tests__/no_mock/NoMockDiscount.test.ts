import request from "supertest";
import app from "../../index";
import { client } from "../../services";
import { ObjectId } from "mongodb";
import { UserNotificationData } from "../../interfaces/NotificationInterfaces";
import { Discount } from "../../interfaces/DiscountInterfaces";

// constants for discounts saved in db
const DB_NAME = "discounts";
const COLLECTION_NAME = "discounts";

// Interface POST /discounts
describe("Unmocked: POST /discounts", () => {
  // Input: valid discount
  // Expected status code: 201
  // Expected behavior: discount is saved in db
  // Expected output: message with discountID
  test("Valid discount", async () => {
    // add token to db for person who will receive discount notification
    await client
      .db(DB_NAME)
      .collection<UserNotificationData>("notifications")
      .insertOne({ userID: "123", fcmToken: "real-token" });

    const discount = {
      storeID: "store1",
      storeName: "Store 1",
      ingredient: "apple",
      price: 1.5,
    };

    const response = await request(app)
      .post("/discounts")
      .send(discount)
      .set("Accept", "application/json");

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Discount created successfully");
    expect(response.body.discountID).toBeDefined();

    // check if discount is saved in db
    const discountID = response.body.discountID;
    const dbDiscount = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(discountID) });

    expect(dbDiscount).not.toBeNull();
    expect(dbDiscount?.storeID).toBe(discount.storeID);
    expect(dbDiscount?.storeName).toBe(discount.storeName);
    expect(dbDiscount?.ingredient).toBe(discount.ingredient);
    expect(dbDiscount?.price).toBe(discount.price);

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input: discount missing all fields
  // Expected status code: 400
  // Expected behavior: discount is not saved in db
  // Expected output: error message with missing fields
  test("Missing body params", async () => {
    const dbCountBefore = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    const response = await request(app).post("/discounts").send({}).expect(400);

    // error should mention parameters missing
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("storeID")
      )
    ).toBe(true);
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("storeName")
      )
    ).toBe(true);
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("ingredient")
      )
    ).toBe(true);
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("price")
      )
    ).toBe(true);

    // check db is unchanged
    const dbCountAfter = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    expect(dbCountAfter).toBe(dbCountBefore);
  });

  // Input: discount with negative price
  // Expected status code: 400
  // Expected behavior: discount is not saved in db
  // Expected output: error message mentioning negative price
  test("Negative price", async () => {
    const dbCountBefore = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    const discount = {
      storeID: "store1",
      storeName: "Store 1",
      ingredient: "apple",
      price: -1.5,
    };

    const response = await request(app)
      .post("/discounts")
      .send(discount)
      .expect(400);

    expect(response.body).toHaveProperty("error", "Price cannot be negative");

    // check db is unchanged
    const dbCountAfter = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    expect(dbCountAfter).toBe(dbCountBefore);
  });

  // Input: discount with non-numeric price
  // Expected status code: 400
  // Expected behavior: discount is not saved in db
  // Expected output: error message mentioning price is non-numeric
  test("Price is non-numeric", async () => {
    const dbCountBefore = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    const discount = {
      storeID: "store1",
      storeName: "Store 1",
      ingredient: "apple",
      price: "not a number",
    };

    const response = await request(app)
      .post("/discounts")
      .send(discount)
      .expect(400);

    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("price is required and must be a number")
      )
    ).toBe(true);

    // check db is unchanged
    const dbCountAfter = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    expect(dbCountAfter).toBe(dbCountBefore);
  });
});

// Interface GET /discounts/:id
describe("Unmocked: GET /discounts/:id", () => {
  const SAMPLE_DISCOUNT1 = {
    storeID: "store1",
    storeName: "Store 1",
    ingredient: "apple",
    price: 1.5,
  };
  const SAMPLE_DISCOUNT2 = {
    storeID: "store1",
    storeName: "Store 1",
    ingredient: "banana",
    price: 2.5,
  };

  // Input: valid SAMPLE_DISCOUNT1 and SAMPLE_DISCOUNT2 saved in db
  // Expected status code: 200
  // Expected behavior: discount details are returned
  // Expected output: discount details match SAMPLE_DISCOUNT1 and SAMPLE_DISCOUNT2
  test("Valid storeID with discounts", async () => {
    // save discounts to db
    const discountID1 = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .insertOne(SAMPLE_DISCOUNT1);
    const discountID2 = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .insertOne(SAMPLE_DISCOUNT2);

    const response = await request(app).get("/discounts/store1").expect(200);

    expect(response.body).toHaveLength(2);

    // first discount
    expect(response.body[0].discountID).toBe(
      new ObjectId(discountID1.insertedId).toHexString()
    );
    expect(response.body[0].storeID).toBe(SAMPLE_DISCOUNT1.storeID);
    expect(response.body[0].storeName).toBe(SAMPLE_DISCOUNT1.storeName);
    expect(response.body[0].ingredient).toBe(SAMPLE_DISCOUNT1.ingredient);
    expect(response.body[0].price).toBe(SAMPLE_DISCOUNT1.price);

    // second discount
    expect(response.body[1].discountID).toBe(
      new ObjectId(discountID2.insertedId).toHexString()
    );
    expect(response.body[1].storeID).toBe(SAMPLE_DISCOUNT2.storeID);
    expect(response.body[1].storeName).toBe(SAMPLE_DISCOUNT2.storeName);
    expect(response.body[1].ingredient).toBe(SAMPLE_DISCOUNT2.ingredient);
    expect(response.body[1].price).toBe(SAMPLE_DISCOUNT2.price);

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input: nonexistant storeID
  // Expected status code: 404
  // Expected behavior: no discounts found for store
  // Expected output: error message mentioning no discounts found
  test("Nonexistant storeID", async () => {
    const response = await request(app)
      .get("/discounts/nonexistent")
      .expect(404);

    expect(response.body).toHaveProperty(
      "error",
      "No discounts found for this store"
    );
  });

  // Input: storeID missing in url
  // Expected status code: 404
  // Expected behavior: no discounts found for store
  // Expected output: empty object
  test("Missing storeID", async () => {
    const response = await request(app).get("/discounts/").expect(404); // malformed url
    expect(response.body).toMatchObject({});
  });
});

// Interface GET /discounts
describe("Unmocked: GET /discounts", () => {
  const SAMPLE_DISCOUNT1 = {
    storeID: "store1",
    storeName: "Store 1",
    ingredient: "apple",
    price: 1.5,
  };
  const SAMPLE_DISCOUNT2 = {
    storeID: "store2",
    storeName: "Store 2",
    ingredient: "banana",
    price: 2.5,
  };

  // Input: valid SAMPLE_DISCOUNT1 and SAMPLE_DISCOUNT2 saved in db
  // Expected status code: 200
  // Expected behavior: all discounts are returned
  // Expected output: discounts match SAMPLE_DISCOUNT1 and SAMPLE_DISCOUNT2
  test("Valid list of discounts", async () => {
    // save discounts to db
    await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .insertOne(SAMPLE_DISCOUNT1);
    await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .insertOne(SAMPLE_DISCOUNT2);

    const response = await request(app).get("/discounts").expect(200);

    expect(response.body).toHaveLength(2);

    // first discount
    expect(response.body[0].storeID).toBe(SAMPLE_DISCOUNT1.storeID);
    expect(response.body[0].storeName).toBe(SAMPLE_DISCOUNT1.storeName);
    expect(response.body[0].ingredient).toBe(SAMPLE_DISCOUNT1.ingredient);
    expect(response.body[0].price).toBe(SAMPLE_DISCOUNT1.price);

    // second discount
    expect(response.body[1].storeID).toBe(SAMPLE_DISCOUNT2.storeID);
    expect(response.body[1].storeName).toBe(SAMPLE_DISCOUNT2.storeName);
    expect(response.body[1].ingredient).toBe(SAMPLE_DISCOUNT2.ingredient);
    expect(response.body[1].price).toBe(SAMPLE_DISCOUNT2.price);

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input: no discounts saved in db
  // Expected status code: 404
  // Expected behavior: no discounts found
  // Expected output: error message mentioning no discounts found
  test("No discounts available", async () => {
    const response = await request(app).get("/discounts").expect(404);
    expect(response.body).toHaveProperty("error", "No discounts found");
  });

  // Input: ingredient query parameter and valid SAMPLE_DISCOUNT1 and SAMPLE_DISCOUNT2 saved in db
  // Expected status code: 200
  // Expected behavior: only discounts with ingredient are returned
  // Expected output: only SAMPLE_DISCOUNT1 is returned
  test("Optional ingredient query parameter", async () => {
    // save discounts to db
    await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .insertOne(SAMPLE_DISCOUNT1);
    await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .insertOne(SAMPLE_DISCOUNT2);

    const response = await request(app)
      .get("/discounts?ingredient=apple")
      .expect(200);

    expect(response.body).toHaveLength(1);

    // only first discount
    expect(response.body[0].storeID).toBe(SAMPLE_DISCOUNT1.storeID);
    expect(response.body[0].storeName).toBe(SAMPLE_DISCOUNT1.storeName);
    expect(response.body[0].ingredient).toBe(SAMPLE_DISCOUNT1.ingredient);
    expect(response.body[0].price).toBe(SAMPLE_DISCOUNT1.price);

    // db cleanup happens in afterEach in jest.setup.ts
  });
});

// Interface DELETE /discounts/:id
describe("Unmocked: DELETE /discounts/:id", () => {
  // Input: valid discount saved in db
  // Expected status code: 200
  // Expected behavior: discount is deleted from db
  // Expected output: success message
  test("Valid discount delete", async () => {
    const discount = {
      storeID: "store1",
      storeName: "Store 1",
      ingredient: "apple",
      price: 1.5,
    };

    // save discount to db
    const discountID = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .insertOne(discount);

    const dbCountBefore = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .delete(`/discounts/${discountID.insertedId}`)
      .expect(200);

    expect(response.body).toHaveProperty("success", true);

    const dbCountAfter = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    expect(dbCountAfter).toBe(dbCountBefore - 1);
  });

  // Input: discountID is not a valid ObjectId
  // Expected status code: 400
  // Expected behavior: discount is not deleted from db
  // Expected output: error message mentioning invalid discountID format
  test("Invalid discountID format", async () => {
    const dbCountBefore = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    // discountID is not a valid ObjectId
    const response = await request(app)
      .delete("/discounts/invalid")
      .expect(400);

    expect(response.body).toHaveProperty("error", "Invalid discountID format");

    // check db is unchanged
    const dbCountAfter = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    expect(dbCountAfter).toBe(dbCountBefore);
  });

  // Input: discountID is valid ObjectId but doesn't exist in db
  // Expected status code: 404
  // Expected behavior: discount is not deleted from db
  // Expected output: error message mentioning discount doesn't exist
  test("Discount doesn't exist", async () => {
    const dbCountBefore = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    // discountID is valid ObjectId but doesn't exist in db
    const response = await request(app)
      .delete(`/discounts/${new ObjectId()}`)
      .expect(404);

    expect(response.body).toHaveProperty("error", "Discount not found");

    // check db is unchanged
    const dbCountAfter = await client
      .db(DB_NAME)
      .collection<Discount>(COLLECTION_NAME)
      .countDocuments();

    expect(dbCountAfter).toBe(dbCountBefore);
  });
});
