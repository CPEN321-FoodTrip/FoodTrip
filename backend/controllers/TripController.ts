import { NextFunction, Request, Response } from "express";

export class TripController {
  sayHello(req: Request, res: Response) {
    res.send("Hello World!");
  }

  async generateRoute(req: Request, res: Response, next: NextFunction) {}
}
