import { getUserRoutes } from "../controllers/UserController";

export const UserRoutes = [
  {
    method: "get",
    route: "/users/:userID/routes",
    action: getUserRoutes,
    validation: [],
  },
];
