import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { userIdSchema, updateUserSchema } from "../../middleware/validation.js";
import { generateHash } from "../../utils/bcrypt.js";
import { deleteUser, getUserById, getUsers, updateUser } from "./users.service.js";

const validationError = (issues) => new ApiError(400, "Validation failed", issues);

export const getUsersController = async (req, res, next) => {
  try {
    const users = await getUsers();
    res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getUserController = async (req, res, next) => {
  try {
    const result = userIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    const user = await getUserById(result.data.id);
    res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateUserController = async (req, res, next) => {
  try {
    const paramsResult = userIdSchema.safeParse(req.params);
    const bodyResult = updateUserSchema.safeParse(req.body);

    if (!paramsResult.success) throw validationError(paramsResult.error.issues);
    if (!bodyResult.success) throw validationError(bodyResult.error.issues);

    const payload = { ...bodyResult.data };
    if (payload.password) {
      payload.password = await generateHash(payload.password);
    }

    const user = await updateUser(paramsResult.data.id, payload);
    res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteUserController = async (req, res, next) => {
  try {
    const result = userIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    await deleteUser(result.data.id);
    res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
  } catch (error) {
    next(error);
  }
};
