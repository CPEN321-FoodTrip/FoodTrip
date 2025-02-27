import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

const client = new MongoClient(
  process.env.DB_URI ?? "mongodb://localhost:27017"
);

client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");

    app.listen(process.env.PORT, () => {
      console.log("Server is running on port " + process.env.PORT);
    });
  })
  .catch((err: Error) => {
    console.error(err);
    client.close();
  });

const errorHandle = (req: Request, res: Response) => {
  console.error(res.status);
};

app.use(errorHandle);
