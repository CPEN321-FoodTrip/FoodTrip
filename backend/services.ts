import { MongoClient } from "mongodb";
import * as admin from "firebase-admin";

export let client: MongoClient;

export function initializeClient(customClient?: MongoClient) {
  if (customClient) {
    client = customClient;
  } else {
    client = new MongoClient(process.env.DB_URI ?? "mongodb://localhost:27017");
  }
}

export function initializeFirebaseAdmin() {
  if (admin.apps.length === 0) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "{}"
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}
