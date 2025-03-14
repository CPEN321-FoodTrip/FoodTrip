import request from "supertest";
import app from "../../index";
import * as DiscountHelpers from "../../helpers/DiscountHelper";
import { ObjectId } from "mongodb";
import { client } from "../../services";

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
  test("Valid discount mock retrieved", async () => {
    const discountID = new ObjectId().toHexString();
    jest
      .spyOn(DiscountHelpers, "getDiscountsFromDb")
      .mockResolvedValue([{ discountID, storeID: "123" }]);

    const response = await request(app).get("/discounts/123").expect(200);

    expect(response.body).toEqual([{ discountID, storeID: "123" }]);
    expect(DiscountHelpers.getDiscountsFromDb).toHaveBeenCalled();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid discount in-mem retrieved", async () => {
    // use in-memory db for mock data
    const discountID = (
      await client
        .db("discounts")
        .collection("discounts")
        .insertOne({ storeID: "123" })
    ).insertedId.toHexString();

    const response = await request(app).get("/discounts/123").expect(200);

    expect(response.body).toEqual([{ discountID, storeID: "123" }]);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("No discounts for storeID", async () => {
    // in-memory db empty, cleared after each test in jest setup
    const response = await request(app).get("/discounts/123").expect(404);

    expect(response.body).toHaveProperty(
      "error",
      "No discounts found for this store"
    );
  });
});

describe("Mocked: GET /discounts", () => {
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
  test("Valid discounts mock retrieved", async () => {
    const discounts = [
      { discountID: "123", storeID: "123" },
      { discountID: "456", storeID: "456" },
    ];
    jest
      .spyOn(DiscountHelpers, "getAllDiscountsFromDb")
      .mockResolvedValue(discounts);

    const response = await request(app).get("/discounts").expect(200);

    expect(response.body).toEqual(discounts);
    expect(DiscountHelpers.getAllDiscountsFromDb).toHaveBeenCalled();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Discount from empty db no query", async () => {
    // in-memory db empty, cleared after each test in jest setup
    const response = await request(app).get("/discounts").expect(404);

    expect(response.body).toHaveProperty("error", "No discounts found");
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Discount from empty db with query", async () => {
    // in-memory db empty, cleared after each test in jest setup
    const response = await request(app)
      .get("/discounts")
      .query({ ingredient: "tomato" })
      .expect(404);

    expect(response.body).toHaveProperty("error", "No discounts found");
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Optional ingredient query mock implemented", async () => {
    const mockDiscount = { storeName: "mock store" };
    jest
      .spyOn(DiscountHelpers, "getAllDiscountsFromDb")
      .mockImplementation((ingredient: string) => {
        return Promise.resolve(ingredient === "apple" ? [mockDiscount] : []);
      });

    const response = await request(app)
      .get("/discounts")
      .query({ ingredient: "apple" })
      .expect(200);

    expect(response.body).toEqual([mockDiscount]);
    expect(DiscountHelpers.getAllDiscountsFromDb).toHaveBeenCalled();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Optional ingredient query in-mem db", async () => {
    // use in-memory db for mock data
    const mockDiscount = { storeName: "mock store", ingredient: "apple" };
    await client
      .db("discounts")
      .collection("discounts")
      .insertOne(mockDiscount);

    const response = await request(app)
      .get("/discounts")
      .query({ ingredient: "apple" })
      .expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0]).toHaveProperty("storeName", "mock store");
  });
});

describe("Mocked: DELETE /discounts/:id", () => {
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
  test("Valid discount deleted through mock", async () => {
    jest.spyOn(DiscountHelpers, "deleteDiscountFromDb").mockResolvedValue(1);

    const discountID = new ObjectId().toHexString();
    const response = await request(app)
      .delete(`/discounts/${discountID}`)
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(DiscountHelpers.deleteDiscountFromDb).toHaveBeenCalled();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Delete from empty db", async () => {
    // in-memory db empty, cleared after each test in jest setup
    const discountID = new ObjectId().toHexString();
    const response = await request(app)
      .delete(`/discounts/${discountID}`)
      .expect(404);

    expect(response.body).toHaveProperty("error", "Discount not found");
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Invalid discountId format", async () => {
    jest.spyOn(DiscountHelpers, "deleteDiscountFromDb").mockResolvedValue(0);

    const response = await request(app)
      .delete("/discounts/invalid_id")
      .expect(400);

    expect(response.body).toHaveProperty("error", "Invalid discountID format");
    expect(DiscountHelpers.deleteDiscountFromDb).not.toHaveBeenCalled();
  });
});
