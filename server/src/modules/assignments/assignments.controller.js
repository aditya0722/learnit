import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  assignmentIdParamsSchema,
  assignmentIdSchema,
  assignmentParamsSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
} from "../../middleware/validation.js";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  getAssignmentsByChapter,
  updateAssignment,
} from "./assignments.service.js";

const validationError = (issues) => new ApiError(400, "Validation failed", issues);

export const getAssignmentsController = async (req, res, next) => {
  try {
    const assignments = await getAssignments();
    res.status(200).json(new ApiResponse(200, assignments, "Assignments fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getAssignmentsByChapterController = async (req, res, next) => {
  try {
    const result = assignmentParamsSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    const assignments = await getAssignmentsByChapter(result.data.chapterId);
    res.status(200).json(new ApiResponse(200, assignments, "Chapter assignments fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const getAssignmentController = async (req, res, next) => {
  try {
    const result = assignmentIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    const assignment = await getAssignmentById(result.data.id);
    res.status(200).json(new ApiResponse(200, assignment, "Assignment fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const createAssignmentController = async (req, res, next) => {
  try {
    const paramsResult = assignmentParamsSchema.safeParse(req.params);
    if (!paramsResult.success) throw validationError(paramsResult.error.issues);

    const bodyResult = createAssignmentSchema.safeParse({
      ...req.body,
      chapter: req.body.chapter ?? req.params.chapterId,
    });
    if (!bodyResult.success) throw validationError(bodyResult.error.issues);

    const assignment = await createAssignment(bodyResult.data);
    res.status(201).json(new ApiResponse(201, assignment, "Assignment created successfully"));
  } catch (error) {
    next(error);
  }
};

export const createRootAssignmentController = async (req, res, next) => {
  try {
    const result = createAssignmentSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    const assignment = await createAssignment(result.data);
    res.status(201).json(new ApiResponse(201, assignment, "Assignment created successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateAssignmentController = async (req, res, next) => {
  try {
    const paramsResult = assignmentIdParamsSchema.safeParse(req.params);
    const bodyResult = updateAssignmentSchema.safeParse(req.body);

    if (!paramsResult.success) throw validationError(paramsResult.error.issues);
    if (!bodyResult.success) throw validationError(bodyResult.error.issues);

    const assignment = await updateAssignment(paramsResult.data.assignmentId, bodyResult.data);
    res.status(200).json(new ApiResponse(200, assignment, "Assignment updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateRootAssignmentController = async (req, res, next) => {
  try {
    const paramsResult = assignmentIdSchema.safeParse(req.params);
    const bodyResult = updateAssignmentSchema.safeParse(req.body);

    if (!paramsResult.success) throw validationError(paramsResult.error.issues);
    if (!bodyResult.success) throw validationError(bodyResult.error.issues);

    const assignment = await updateAssignment(paramsResult.data.id, bodyResult.data);
    res.status(200).json(new ApiResponse(200, assignment, "Assignment updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteAssignmentController = async (req, res, next) => {
  try {
    const result = assignmentIdParamsSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    await deleteAssignment(result.data.assignmentId);
    res.status(200).json(new ApiResponse(200, null, "Assignment deleted successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteRootAssignmentController = async (req, res, next) => {
  try {
    const result = assignmentIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    await deleteAssignment(result.data.id);
    res.status(200).json(new ApiResponse(200, null, "Assignment deleted successfully"));
  } catch (error) {
    next(error);
  }
};
