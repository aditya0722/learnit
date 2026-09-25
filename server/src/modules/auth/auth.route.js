import express from "express";
import {
  loginController,
  registerController,
  refreshController,
  logoutController,
  changePasswordController,
  resetPasswordRequestController,
  resetPasswordConfirmController,
  meController,
} from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";

const AuthRouter = express.Router();

AuthRouter.post("/login", loginController);
AuthRouter.post("/register", registerController);
AuthRouter.post("/refresh", refreshController);
AuthRouter.post("/logout", logoutController);
AuthRouter.get("/me", authenticate, meController);
AuthRouter.post("/change-password", authenticate, changePasswordController);
AuthRouter.post("/reset-password-request", resetPasswordRequestController);
AuthRouter.post("/reset-password-confirm", resetPasswordConfirmController);

export default AuthRouter;
