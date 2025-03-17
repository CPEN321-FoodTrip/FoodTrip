import request from "supertest";
import app from "../../index";
import * as DiscountHelpers from "../../helpers/DiscountHelper";
import * as NotificationHelper from "../../helpers/NotificationHelper";
import { ObjectId } from "mongodb";
import { client } from "../../services";

// mock firebase-admin messaging for new discount notifications
jest.mock("firebase-admin", () => {
  const actualAdmin = jest.requireActual("firebase-admin");
  return {
    ...actualAdmin,
    messaging: jest.fn().mockReturnValue({
      sendEachForMulticast: jest.fn().mockResolvedValue("Message sent"),
    }),
  };
});

// Interface POST /discounts
describe("Mocked: POST /discounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: DiscountHelpers.addDiscountToDb throws an error
  // Input: valid discount
  // Expected status code: 500
  // Expected behavior: error is handled gracefully and no notifications are sent
  // Expected output: error message
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
    expect(
      require("firebase-admin").messaging().sendEachForMulticast
    ).not.toHaveBeenCalled();
  });

  // Mocked behavior: DiscountHelpers.addDiscountToDb returns a discountID and getAllTokensFromDb
  //                  returns fcm tokens for notifications
  // Input: valid discount
  // Expected status code: 201
  // Expected behavior: discount is created and stored in db and notifications are sent
  // Expected output: success message and discountID
  test("Valid discount, mocked db response", async () => {
    const discountID = new ObjectId().toHexString();
    jest
      .spyOn(DiscountHelpers, "addDiscountToDb")
      .mockResolvedValue(discountID);
    jest
      .spyOn(NotificationHelper, "getAllTokensFromDb")
      .mockResolvedValue(["token1", "token2"]);

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
    expect(NotificationHelper.getAllTokensFromDb).toHaveBeenCalled();
    expect(
      require("firebase-admin").messaging().sendEachForMulticast
    ).toHaveBeenCalled();
  });

  // Mocked behavior: in-memory db is used for storing discounts and notifications
  // Input: valid discount
  // Expected status code: 201
  // Expected behavior: discount is created and stored in in-memory db and notifications are sent
  // Expected output: success message and discountID
  test("Valid discount, in-memory db", async () => {
    await client
      .db("discounts")
      .collection("notifications")
      .insertOne({ userID: "123", fcmToken: "token1" });

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
    expect(
      require("firebase-admin").messaging().sendEachForMulticast
    ).toHaveBeenCalled();
  });

  // Mocked behavior: DiscountHelpers.addDiscountToDb returns a discountID and getAllTokensFromDb
  //                  returns an empty array of fcm tokens
  // Input: valid discount
  // Expected status code: 201
  // Expected behavior: discount is created and stored in db and no notifications are sent
  // Expected output: success message and discountID
  test("Valid discount, no notification subscribers", async () => {
    const discountID = new ObjectId().toHexString();
    jest
      .spyOn(DiscountHelpers, "addDiscountToDb")
      .mockResolvedValue(discountID);
    jest.spyOn(NotificationHelper, "getAllTokensFromDb").mockResolvedValue([]);

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
    expect(NotificationHelper.getAllTokensFromDb).toHaveBeenCalled();
    expect(
      require("firebase-admin").messaging().sendEachForMulticast
    ).not.toHaveBeenCalled();
  });

  // Mocked behavior: DiscountHelpers.addDiscountToDb returns a discountID, getAllTokensFromDb
  //                  returns fcm tokens for notifications, sendEachForMulticast fails to send
  // Input: valid discount
  // Expected status code: 201
  // Expected behavior: discount is created and stored in db and notifications fail to send
  // Expected output: success message and discountID
  test("Valid discount, notifications fail to send", async () => {
    const discountID = new ObjectId().toHexString();
    jest
      .spyOn(DiscountHelpers, "addDiscountToDb")
      .mockResolvedValue(discountID);
    jest
      .spyOn(NotificationHelper, "getAllTokensFromDb")
      .mockResolvedValue(["token1", "token2"]);
    jest
      .spyOn(require("firebase-admin").messaging(), "sendEachForMulticast")
      .mockResolvedValue({ failureCount: 1 });

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
    expect(NotificationHelper.getAllTokensFromDb).toHaveBeenCalled();
    expect(
      require("firebase-admin").messaging().sendEachForMulticast
    ).toHaveBeenCalled();
  });

  // Mocked behavior: DiscountHelpers.addDiscountToDb with empty imlementation
  // Input: discount with missing fields
  // Expected status code: 400
  // Expected behavior: error is handled gracefully and no notifications are sent
  // Expected output: error message
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
    expect(
      require("firebase-admin").messaging().sendEachForMulticast
    ).not.toHaveBeenCalled();
  });
});

// Interface GET /discounts/:id
describe("Mocked: GET /discounts/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: DiscountHelpers.getDiscountsFromDb throws an error
  // Input: valid storeID
  // Expected status code: 500
  // Expected behavior: error is handled gracefully
  // Expected output: error message
  test("Database connection failure", async () => {
    jest.spyOn(DiscountHelpers, "getDiscountsFromDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app).get("/discounts/123").expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(DiscountHelpers.getDiscountsFromDb).toHaveBeenCalled();
  });

  // Mocked behavior: DiscountHelpers.getDiscountsFromDb returns a discount
  // Input: valid storeID
  // Expected status code: 200
  // Expected behavior: discounts are retrieved from db
  // Expected output: discounts array
  test("Valid discount mock retrieved", async () => {
    const discountID = new ObjectId().toHexString();
    jest
      .spyOn(DiscountHelpers, "getDiscountsFromDb")
      .mockResolvedValue([{ discountID, storeID: "123" }]);

    const response = await request(app).get("/discounts/123").expect(200);

    expect(response.body).toEqual([{ discountID, storeID: "123" }]);
    expect(DiscountHelpers.getDiscountsFromDb).toHaveBeenCalled();
  });

  // Mocked behavior: in-memory db is used for storing discounts
  // Input: valid storeID with discount in in-memory db
  // Expected status code: 200
  // Expected behavior: discounts are retrieved from in-memory db
  // Expected output: discounts array
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

  // Mocked behavior: in-memory db is empty
  // Input: valid storeID with no discounts
  // Expected status code: 404
  // Expected behavior: no discounts found for storeID
  // Expected output: error message
  test("No discounts for storeID", async () => {
    // in-memory db empty, cleared after each test in jest setup
    const response = await request(app).get("/discounts/123").expect(404);

    expect(response.body).toHaveProperty(
      "error",
      "No discounts found for this store"
    );
  });
});

// Interface GET /discounts
describe("Mocked: GET /discounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: DiscountHelpers.getAllDiscountsFromDb throws an error
  // Input: none
  // Expected status code: 500
  // Expected behavior: error is handled gracefully
  // Expected output: error message
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

  // Mocked behavior: DiscountHelpers.getAllDiscountsFromDb returns an array
  // Input: two mock discounts
  // Expected status code: 200
  // Expected behavior: discounts are retrieved from db
  // Expected output: discounts array
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

  // Mocked behavior: in-memory db is empty
  // Input: none
  // Expected status code: 404
  // Expected behavior: no discounts found in db
  // Expected output: error message
  test("Discount from empty db no query", async () => {
    // in-memory db empty, cleared after each test in jest setup
    const response = await request(app).get("/discounts").expect(404);

    expect(response.body).toHaveProperty("error", "No discounts found");
  });

  // Mocked behavior: in-memory db is empty
  // Input: ingredient query
  // Expected status code: 404
  // Expected behavior: no discounts found for ingredient
  // Expected output: error message
  test("Discount from empty db with query", async () => {
    // in-memory db empty, cleared after each test in jest setup
    const response = await request(app)
      .get("/discounts")
      .query({ ingredient: "tomato" })
      .expect(404);

    expect(response.body).toHaveProperty("error", "No discounts found");
  });

  // Mocked behavior: DiscountHelpers.getAllDiscountsFromDb returns an array
  // Input: ingredient query
  // Expected status code: 200
  // Expected behavior: discounts are retrieved from db
  // Expected output: discounts array
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

  // Mocked behavior: in-memory db is used for storing discounts
  // Input: ingredient query
  // Expected status code: 200
  // Expected behavior: discounts are retrieved from in-memory db
  // Expected output: discounts array
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

// Interface DELETE /discounts/:id
describe("Mocked: DELETE /discounts/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: DiscountHelpers.deleteDiscountFromDb throws an error
  // Input: valid discountId
  // Expected status code: 500
  // Expected behavior: error is handled gracefully
  // Expected output: error message
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

  // Mocked behavior: DiscountHelpers.deleteDiscountFromDb returns 1
  // Input: valid discountId
  // Expected status code: 200
  // Expected behavior: discount is deleted from db
  // Expected output: success message
  test("Valid discount deleted through mock", async () => {
    jest.spyOn(DiscountHelpers, "deleteDiscountFromDb").mockResolvedValue(1);

    const discountID = new ObjectId().toHexString();
    const response = await request(app)
      .delete(`/discounts/${discountID}`)
      .expect(200);

    expect(response.body).toHaveProperty("success", true);
    expect(DiscountHelpers.deleteDiscountFromDb).toHaveBeenCalled();
  });

  // Mocked behavior: in-memory db is empty
  // Input: valid discountId
  // Expected status code: 404
  // Expected behavior: discount not found in db
  // Expected output: error message
  test("Delete from empty db", async () => {
    // in-memory db empty, cleared after each test in jest setup
    const discountID = new ObjectId().toHexString();
    const response = await request(app)
      .delete(`/discounts/${discountID}`)
      .expect(404);

    expect(response.body).toHaveProperty("error", "Discount not found");
  });

  // Mocked behavior: DiscountHelpers.deleteDiscountFromDb with empty implementation
  // Input: discountId with invalid format
  // Expected status code: 400
  // Expected behavior: deleteDiscountFromDb is not called
  // Expected output: error message
  test("Invalid discountId format", async () => {
    jest.spyOn(DiscountHelpers, "deleteDiscountFromDb").mockImplementation();

    const response = await request(app)
      .delete("/discounts/invalid_id")
      .expect(400);

    expect(response.body).toHaveProperty("error", "Invalid discountID format");
    expect(DiscountHelpers.deleteDiscountFromDb).not.toHaveBeenCalled();
  });
});
