import request from "supertest";
import app from "../../index";
import * as DiscountHelpers from "../../helpers/DiscountHelper";
import { ObjectId } from "mongodb";

describe("Mocked: POST /discounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Database connection failure", async () => {
    jest.spyOn(DiscountHelpers, "addDiscountToDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .post("/discounts")
      .send({
        storeID: "123",
        storeName: "Test Store",
        ingredient: "apple",
        price: 0.5,
      })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(DiscountHelpers.addDiscountToDb).toHaveBeenCalled();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid discount mocked db response", async () => {
    const discountID = new ObjectId().toHexString();
    jest
      .spyOn(DiscountHelpers, "addDiscountToDb")
      .mockResolvedValue(discountID);

    const response = await request(app)
      .post("/discounts")
      .send({
        storeID: "123",
        storeName: "Test Store",
        ingredient: "apple",
        price: 0.5,
      })
      .expect(201);

    expect(response.body).toHaveProperty(
      "message",
      "Discount created successfully"
    );
    expect(response.body).toHaveProperty("discountID", discountID);
    expect(DiscountHelpers.addDiscountToDb).toHaveBeenCalled();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid discount in-memory db", async () => {
    const response = await request(app)
      .post("/discounts")
      .send({
        storeID: "123",
        storeName: "Test Store",
        ingredient: "apple",
        price: 0.5,
      })
      .expect(201);

    expect(response.body).toHaveProperty(
      "message",
      "Discount created successfully"
    );
    expect(response.body).toHaveProperty("discountID");
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Missing discount parameters", async () => {
    jest.spyOn(DiscountHelpers, "addDiscountToDb").mockImplementation();

    const response = await request(app)
      .post("/discounts")
      .send({
        storeID: "123",
        storeName: "Test Store",
      })
      .expect(400);

    // error should include missing ingredient and price
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
    expect(DiscountHelpers.addDiscountToDb).not.toHaveBeenCalled();
  });
});

describe("Mocked: GET /discounts/:id", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Database connection failure", async () => {
    jest.spyOn(DiscountHelpers, "getDiscountsFromDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app).get("/discounts/123").expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(DiscountHelpers.getDiscountsFromDb).toHaveBeenCalled();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("", async () => {});
});

describe("Mocked: GET /discounts", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Database connection failure", async () => {
    jest
      .spyOn(DiscountHelpers, "getAllDiscountsFromDb")
      .mockImplementation(() => {
        throw new Error("Forced error");
      });

    const response = await request(app).get("/discounts").expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(DiscountHelpers.getAllDiscountsFromDb).toHaveBeenCalled();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("", async () => {});
});

describe("Mocked: DELETE /discounts/:id", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Database connection failure", async () => {
    jest
      .spyOn(DiscountHelpers, "deleteDiscountFromDb")
      .mockImplementation(() => {
        throw new Error("Forced error");
      });

    const discountID = new ObjectId().toHexString();
    const response = await request(app)
      .delete(`/discounts/${discountID}`)
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(DiscountHelpers.deleteDiscountFromDb).toHaveBeenCalled();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("", async () => {});
});
