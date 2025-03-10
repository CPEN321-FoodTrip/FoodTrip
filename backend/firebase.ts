import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";

const serviceAccount = require("firebase-adminsdk.json"); // TODO: Replace this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

export default admin;
