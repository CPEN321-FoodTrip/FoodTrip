import request from "supertest";
import app from "../../index";
import { client } from "../../services";

const DB_NAME = "discounts";
const COLLECTION_NAME = "notifications";

// Interface POST /notifications/subscribe
describe("Unmocked: POST /notifications/subscribe", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Subscribe success", async () => {
    const userID = "12345";
    const fcmToken = "real-token";
    const response = await request(app)
      .post("/notifications/subscribe")
      .send({ userID: userID, fcmToken: fcmToken })
      .expect(201);

    expect(response.text).toBe("Subscribed successfully");

    // verify token added to db
    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .findOne({ userID: userID });
    expect(result).not.toBeNull();
    expect(result?.fcmToken).toBe(fcmToken);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Missing parameters", async () => {
    const countBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/notifications/subscribe")
      .send()
      .expect(400);

    // error should mention parameters missing
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("userID")
      )
    ).toBe(true);
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("fcmToken")
      )
    ).toBe(true);

    // verify db is unchanged
    const countAfter = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();
    expect(countAfter).toBe(countBefore);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Duplicate subscribe", async () => {
    const userID = "12345";
    const fcmtTken = "real-token";
    await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .insertOne({ userID: userID, fcmToken: fcmtTken });

    const countBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/notifications/subscribe")
      .send({ userID: userID, fcmToken: fcmtTken })
      .expect(400);

    expect(response.text).toBe("Already subscribed");

    // verify db is unchanged
    const countAfter = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();
    expect(countAfter).toBe(countBefore);
  });
});

// Interface POST /notifications/unsubscribe
describe("Unmocked: POST /notifications/unsubscribe", () => {
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Unsubscribe success", async () => {
    const userID = "12345";
    const fcmToken = "real-token";
    await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .insertOne({ userID: userID, fcmToken: fcmToken });
    const countBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/notifications/unsubscribe")
      .send({
        userID: userID,
      });

    expect(response.text).toBe("Unsubscribed successfully");

    // verify token removed from db
    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .findOne({ userID: userID });
    expect(result).toBeNull();

    const countAfter = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();
    expect(countAfter).toBe(countBefore - 1);
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Missing parameter", async () => {
    const userID = "12345";
    const fcmToken = "real-token";
    await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .insertOne({ userID: userID, fcmToken: fcmToken });
    const countBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();

    const response = await request(app)
      .post("/notifications/unsubscribe")
      .send()
      .expect(400);

    // error should mention parameter missing
    expect(
      response.body.errors.some((error: { msg: string }) =>
        error.msg.includes("userID")
      )
    ).toBe(true);

    // verify db is unchanged
    const countAfter = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();
    expect(countAfter).toBe(countBefore);

    // verify token still exists in db
    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .findOne({ userID: userID });
    expect(result).not.toBeNull();
  });

  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("User not found", async () => {
    const userID1 = "12345";
    const fcmToken = "real-token";
    await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .insertOne({ userID: userID1, fcmToken: fcmToken });
    const countBefore = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();

    const userID2 = "54321"; // different user id

    const response = await request(app)
      .post("/notifications/unsubscribe")
      .send({ userID: userID2 })
      .expect(400);

    expect(response.text).toBe("Not subscribed");

    // verify db is unchanged
    const countAfter = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .countDocuments();
    expect(countAfter).toBe(countBefore);

    // verify token still exists in db
    const result = await client
      .db(DB_NAME)
      .collection(COLLECTION_NAME)
      .findOne({ userID: userID1 });
    expect(result).not.toBeNull();
  });
});
