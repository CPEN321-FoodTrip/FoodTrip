import request from "supertest";
import app from "../../index";
import { client } from "../../services";
import { ObjectId } from "mongodb";

// constants for discounts saved in db
const DB_NAME = "discounts";
const COLLECTION_NAME = "discounts";

describe("Unmocked: POST /discounts", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid discount", async () => {
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
      .collection(COLLECTION_NAME)
      .findOne({ _id: new ObjectId(discountID) });

    expect(dbDiscount).not.toBeNull();
    expect(dbDiscount?.storeID).toBe(discount.storeID);
    expect(dbDiscount?.storeName).toBe(discount.storeName);
    expect(dbDiscount?.ingredient).toBe(discount.ingredient);
    expect(dbDiscount?.price).toBe(discount.price);

    // db cleanup happens in afterEach in jest.setup.ts
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Missing body params", async () => {
    const dbCountBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
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
      .collection(COLLECTION_NAME)
      .countDocuments();

    expect(dbCountAfter).toBe(dbCountBefore);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Negative price", async () => {
    const dbCountBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
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

    expect(response.body).toHaveProperty(
      "error",
      "Price must be a positive number"
    );

    // check db is unchanged
    const dbCountAfter = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();

    expect(dbCountAfter).toBe(dbCountBefore);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Price is non-numeric", async () => {
    const dbCountBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
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
      .collection(COLLECTION_NAME)
      .countDocuments();

    expect(dbCountAfter).toBe(dbCountBefore);
  });
});

describe("Unmocked: GET /discounts/:id", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("", async () => {});
});

describe("Unmocked: GET /discounts", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("", async () => {});
});

describe("Unmocked: DELETE /discounts/:id", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("", async () => {});
});
