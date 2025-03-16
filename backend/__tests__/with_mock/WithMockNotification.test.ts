import request from "supertest";
import app from "../../index";
import * as NotificationHelper from "../../helpers/NotificationHelper";

// Interface POST /notifications/subscribe
describe("Mocked: POST /notifications/subscribe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior:
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Database connection failure on insert", async () => {
    jest.spyOn(NotificationHelper, "addTokenToDb").mockImplementation(() => {
      throw new Error("Forced error");
    });

    const response = await request(app)
      .post("/notifications/subscribe")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(NotificationHelper.addTokenToDb).toHaveBeenCalled();
  });

  // Mocked behavior:
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Database connection failure on check existing", async () => {
    jest.spyOn(NotificationHelper, "getTokenFromDb").mockImplementation(() => {
      throw new Error("Forced error");
    });
    jest.spyOn(NotificationHelper, "addTokenToDb").mockImplementation();

    const response = await request(app)
      .post("/notifications/subscribe")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(NotificationHelper.getTokenFromDb).toHaveBeenCalled();
    expect(NotificationHelper.addTokenToDb).not.toHaveBeenCalled();
  });

  // Mocked behavior:
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Database failure on insert", async () => {
    jest.spyOn(NotificationHelper, "addTokenToDb").mockResolvedValue(false);

    const response = await request(app)
      .post("/notifications/subscribe")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(NotificationHelper.addTokenToDb).toHaveBeenCalled();
  });

  // Mocked behavior:
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("User already subscribed", async () => {
    jest
      .spyOn(NotificationHelper, "getTokenFromDb")
      .mockResolvedValue("real-token");
    jest.spyOn(NotificationHelper, "addTokenToDb").mockImplementation();

    const response = await request(app)
      .post("/notifications/subscribe")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(400);

    expect(response.body).toBe("Already subscribed");
    expect(NotificationHelper.getTokenFromDb).toHaveBeenCalled();
    expect(NotificationHelper.addTokenToDb).not.toHaveBeenCalled();
  });

  // Mocked behavior:
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Valid subscription", async () => {
    jest.spyOn(NotificationHelper, "getTokenFromDb").mockResolvedValue(null);

    const response = await request(app)
      .post("/notifications/subscribe")
      .send({ userID: "12345", fcmToken: "real-token" })
      .expect(201);

    expect(response.body).toBe("Subscribed successfully");
    expect(NotificationHelper.getTokenFromDb).toHaveBeenCalled();
  });
});

// Interface POST /notifications/unsubscribe
describe("Mocked: POST /notifications/unsubscribe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Mocked behavior:
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Database connection failure", async () => {
    jest
      .spyOn(NotificationHelper, "removeTokenFromDb")
      .mockImplementation(() => {
        throw new Error("Forced error");
      });

    const response = await request(app)
      .post("/notifications/unsubscribe")
      .send({ userID: "12345" })
      .expect(500);

    expect(response.body).toHaveProperty("error", "Internal server error");
    expect(NotificationHelper.removeTokenFromDb).toHaveBeenCalled();
  });

  // Mocked behavior:
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("User not subscribed", async () => {
    jest.spyOn(NotificationHelper, "removeTokenFromDb").mockResolvedValue(0);

    const response = await request(app)
      .post("/notifications/unsubscribe")
      .send({ userID: "12345" })
      .expect(400);

    expect(response.body).toBe("Not subscribed");
    expect(NotificationHelper.removeTokenFromDb).toHaveBeenCalled();
  });

  // Mocked behavior:
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Empty database", async () => {
    // in-memeroy database is empty, cleared in jest setup afterEach
    const response = await request(app)
      .post("/notifications/unsubscribe")
      .send({ userID: "12345" })
      .expect(400);

    expect(response.body).toBe("Not subscribed");
  });

  // Mocked behavior:
  // Input:
  // Expected status code:
  // Expected behavior:
  // Expected output:
  test("Unsubscribe success", async () => {
    jest.spyOn(NotificationHelper, "removeTokenFromDb").mockResolvedValue(1);

    const response = await request(app)
      .post("/notifications/unsubscribe")
      .send({ userID: "12345" })
      .expect(201);

    expect(response.body).toBe("Unsubscribed successfully");
    expect(NotificationHelper.removeTokenFromDb).toHaveBeenCalled();
  });
});
