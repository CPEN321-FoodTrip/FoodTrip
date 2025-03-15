import { UserController } from "../controllers/UserController";

const controller = new UserController();

export const UserRoutes = [
  {
    method: "get",
    route: "/users/:userID/routes",
    action: controller.getUserRoutes,
    validation: [],
  },
];
