import {
  login,
  register,
  refreshTokens,
  logout,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  getMe,
} from "./auth.service.js";
import { generateHash } from "../../utils/bcrypt.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
} from "../../middleware/validation.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const validationError = (issues) => new ApiError(400, "Validation failed", issues);

export const loginController = async (req, res, next) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    const { email, password } = result.data;
    const response = await login(email, password, res);
    return res
      .status(200)
      .json(new ApiResponse(200, response, "Login successful"));
  } catch (e) {
    next(e);
  }
};

export const registerController = async (req, res, next) => {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    const { name, email, password, age } = result.data;
    const newPassword = await generateHash(password);
    const response = await register({ name, email, password: newPassword, age }, res);

    return res
      .status(201)
      .json(new ApiResponse(201, response, "User registered successfully"));
  } catch (e) {
    next(e);
  }
};

export const refreshController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token not found");
    }

    const response = await refreshTokens(refreshToken, res);
    return res
      .status(200)
      .json(new ApiResponse(200, response, "Token refreshed successfully"));
  } catch (e) {
    next(e);
  }
};

export const logoutController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    await logout(refreshToken, res);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (e) {
    next(e);
  }
};

export const changePasswordController = async (req, res, next) => {
  try {
    const result = changePasswordSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    const { currentPassword, newPassword } = result.data;
    const refreshToken = req.cookies?.refresh_token;

    await changePassword(req.user.id, currentPassword, newPassword, refreshToken, res);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  } catch (e) {
    next(e);
  }
};

export const resetPasswordRequestController = async (req, res, next) => {
  try {
    const result = resetPasswordRequestSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    const response = await requestPasswordReset(result.data.email);
    return res
      .status(200)
      .json(new ApiResponse(200, null, response.message));
  } catch (e) {
    next(e);
  }
};

export const resetPasswordConfirmController = async (req, res, next) => {
  try {
    const result = resetPasswordConfirmSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    await confirmPasswordReset(result.data.token, result.data.newPassword);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset successful"));
  } catch (e) {
    next(e);
  }
};

export const meController = async (req, res, next) => {
  try {
    const user = await getMe(req.user.id);
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (e) {
    next(e);
  }
};
