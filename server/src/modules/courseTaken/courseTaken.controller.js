import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  courseTakenIdSchema,
  createCourseTakenSchema,
  updateCourseTakenSchema,
} from "../../middleware/validation.js";
import {
  createCourseTaken,
  deleteCourseTaken,
  getCourseTaken,
  getCourseTakenById,
  updateCourseTaken,
} from "./courseTaken.service.js";

const validationError = (issues) => new ApiError(400, "Validation failed", issues);

export const getCourseTakenController = async (req, res, next) => {
  try {
    const records = await getCourseTaken();
    res.status(200).json(new ApiResponse(200, records, "Course taken records fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getCourseTakenByIdController = async (req, res, next) => {
  try {
    const result = courseTakenIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    const record = await getCourseTakenById(result.data.id);
    res.status(200).json(new ApiResponse(200, record, "Course taken record fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const createCourseTakenController = async (req, res, next) => {
  try {
    const result = createCourseTakenSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    await createCourseTaken(result.data);
    res.status(201).json(new ApiResponse(201, null, "Course taken record created successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateCourseTakenController = async (req, res, next) => {
  try {
    const paramsResult = courseTakenIdSchema.safeParse(req.params);
    const bodyResult = updateCourseTakenSchema.safeParse(req.body);

    if (!paramsResult.success) throw validationError(paramsResult.error.issues);
    if (!bodyResult.success) throw validationError(bodyResult.error.issues);

    const record = await updateCourseTaken(paramsResult.data.id, bodyResult.data);
    res.status(200).json(new ApiResponse(200, record, "Course taken record updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteCourseTakenController = async (req, res, next) => {
  try {
    const result = courseTakenIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    await deleteCourseTaken(result.data.id);
    res.status(200).json(new ApiResponse(200, null, "Course taken record deleted successfully"));
  } catch (error) {
    next(error);
  }
};
