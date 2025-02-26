import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

const client = new MongoClient("mongodb://localhost:27017");

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error(err);
    client.close();
  });

const errorHandle = (req: Request, res: Response) => {
  console.error(res.status);
};

app.use(errorHandle);
