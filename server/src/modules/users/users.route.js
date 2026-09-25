import express from "express";
import {
  deleteUserController,
  getUserController,
  getUsersController,
  updateUserController,
} from "./users.controller.js";

const UsersRouter = express.Router();

UsersRouter.get("/", getUsersController);
UsersRouter.get("/:id", getUserController);
UsersRouter.patch("/:id", updateUserController);
UsersRouter.delete("/:id", deleteUserController);

export default UsersRouter;
