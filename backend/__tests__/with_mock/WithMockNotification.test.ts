import request from "supertest";
import app from "../../index";
import * as NotificationHelper from "../../helpers/NotificationHelper";

// Interface POST /notifications
describe("Mocked: POST /notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: NotificationHelper.addTokenToDb throws an error
  // Input: valid userID and fcmToken
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database connection failure on insert", async () => {
    jest.spyOn(NotificationHelper, "addTokenToDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .post("/notifications")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(NotificationHelper.addTokenToDb).toHaveBeenCalled();
  });

  // Mocked behavior: NotificationHelper.getTokenFromDb throws an error
  // Input: valid userID and fcmToken
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database connection failure on check existing", async () => {
    jest.spyOn(NotificationHelper, "getTokenFromDb").mockImplementation(() => {
      throw new Error("Forced error");
    });
    jest.spyOn(NotificationHelper, "addTokenToDb").mockImplementation();

    const response = await request(app)
      .post("/notifications")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(NotificationHelper.getTokenFromDb).toHaveBeenCalled();
    expect(NotificationHelper.addTokenToDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: NotificationHelper.addTokenToDb returns null for insertedId
  // Input: valid userID and fcmToken
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database failure on insert", async () => {
    jest.spyOn(NotificationHelper, "addTokenToDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .post("/notifications")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(NotificationHelper.addTokenToDb).toHaveBeenCalled();
  });

  // Mocked behavior: NotificationHelper.getTokenFromDb returns a value for existing user and
  //                  NotificationHelper.addTokenToDb has empty implementation
  // Input: valid userID and fcmToken
  // Expected status code: 400
  // Expected behavior: NotificationHelper.addTokenToDb not called
  // Expected output: error message
  test("User already subscribed", async () => {
    jest
      .spyOn(NotificationHelper, "getTokenFromDb")
      .mockResolvedValue("real-token");
    jest.spyOn(NotificationHelper, "addTokenToDb").mockImplementation();

    const response = await request(app)
      .post("/notifications")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(400);

    expect(response.body).toHaveProperty("error", "Already subscribed");
    expect(NotificationHelper.getTokenFromDb).toHaveBeenCalled();
    expect(NotificationHelper.addTokenToDb).not.toHaveBeenCalled();
  });

  // Mocked behavior: NotificationHelper.getTokenFromDb returns null for new user
  // Input: valid userID and fcmToken
  // Expected status code: 201
  // Expected behavior: NotificationHelper.addTokenToDb called
  // Expected output: success message
  test("Valid subscription", async () => {
    jest.spyOn(NotificationHelper, "getTokenFromDb").mockResolvedValue(null);

    const response = await request(app)
      .post("/notifications")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(201);

    expect(response.body).toHaveProperty("message", "Subscribed successfully");
    expect(NotificationHelper.getTokenFromDb).toHaveBeenCalled();
  });
});

// Interface DELETE /notifications
describe("Mocked: DELETE /notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior: NotificationHelper.removeTokenFromDb throws an error
  // Input: valid userID
  // Expected status code: 500
  // Expected behavior: error handled gracefully
  // Expected output: error message
  test("Database connection failure", async () => {
    jest
      .spyOn(NotificationHelper, "removeTokenFromDb")
      .mockImplementation(() => {
        throw new Error("Forced error");
      });

    const response = await request(app)
      .delete("/notifications/12345")
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(NotificationHelper.removeTokenFromDb).toHaveBeenCalled();
  });

  // Mocked behavior: NotificationHelper.removeTokenFromDb returns 0
  // Input: valid userID
  // Expected status code: 400
  // Expected behavior: NotificationHelper.removeTokenFromDb called
  // Expected output: error message
  test("User not subscribed", async () => {
    jest.spyOn(NotificationHelper, "removeTokenFromDb").mockResolvedValue(0);

    const response = await request(app)
      .delete("/notifications/12345")
      .expect(400);

    expect(response.body).toHaveProperty("error", "Not subscribed");
    expect(NotificationHelper.removeTokenFromDb).toHaveBeenCalled();
  });

  // Mocked behavior: in-memory database is empty
  // Input: valid userID
  // Expected status code: 400
  // Expected behavior: none
  // Expected output: error message
  test("Empty database", async () => {
    // in-memory database is empty, cleared in jest setup afterEach
    const response = await request(app)
      .delete("/notifications/12345")
      .expect(400);

    expect(response.body).toHaveProperty("error", "Not subscribed");
  });

  // Mocked behavior: NotificationHelper.removeTokenFromDb returns 1
  // Input: valid userID
  // Expected status code: 200
  // Expected behavior: NotificationHelper.removeTokenFromDb called
  // Expected output: success message
  test("Unsubscribe success", async () => {
    jest.spyOn(NotificationHelper, "removeTokenFromDb").mockResolvedValue(1);

    const response = await request(app)
      .delete("/notifications/12345")
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "Unsubscribed successfully"
    );
    expect(NotificationHelper.removeTokenFromDb).toHaveBeenCalled();
  });
});
