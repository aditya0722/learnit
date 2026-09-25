import { z } from "zod";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  submitAssignment,
  getSubmissionsByAssignment,
  getSubmissionDetail,
} from "./submissions.service.js";
import { executeCode } from "../../services/codeRunner.js";

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        answer: z.string().min(1),
      })
    )
    .min(1, { message: "At least one answer is required" }),
});

const assignmentIdSchema = z.object({
  assignmentId: z.coerce.number().int().positive(),
});

const submissionIdSchema = z.object({
  submissionId: z.coerce.number().int().positive(),
});

export const submitAssignmentController = async (req, res, next) => {
  try {
    const paramsResult = assignmentIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ApiError(400, "Invalid assignment ID");
    }

    const bodyResult = submitSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ApiError(
        400,
        "Validation failed",
        bodyResult.error.issues
      );
    }

    const result = await submitAssignment(
      paramsResult.data.assignmentId,
      req.user.id,
      bodyResult.data.answers
    );

    res
      .status(201)
      .json(
        new ApiResponse(201, result, "Assignment submitted successfully")
      );
  } catch (error) {
    next(error);
  }
};

export const getSubmissionsController = async (req, res, next) => {
  try {
    const paramsResult = assignmentIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ApiError(400, "Invalid assignment ID");
    }

    const submissions = await getSubmissionsByAssignment(
      paramsResult.data.assignmentId,
      req.user.id
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, submissions, "Submissions fetched successfully")
      );
  } catch (error) {
    next(error);
  }
};

export const getSubmissionDetailController = async (req, res, next) => {
  try {
    const paramsResult = submissionIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ApiError(400, "Invalid submission ID");
    }

    const result = await getSubmissionDetail(
      paramsResult.data.submissionId,
      req.user.id
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Submission detail fetched successfully"
        )
      );
  } catch (error) {
    next(error);
  }
};

const runCodeSchema = z.object({
  code: z.string().min(1, { message: "Code is required" }),
  language: z.enum(["javascript", "python", "java", "cpp"]),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        hidden: z.boolean().optional(),
      })
    )
    .min(1, { message: "At least one test case is required" }),
});

export const runCodeController = async (req, res, next) => {
  try {
    const bodyResult = runCodeSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ApiError(400, "Validation failed", bodyResult.error.issues);
    }

    const { code, language, testCases } = bodyResult.data;

    let results;
    try {
      results = await executeCode(code, language, testCases);
    } catch (runError) {
      throw new ApiError(500, runError.message || "Code execution failed");
    }

    res
      .status(200)
      .json(new ApiResponse(200, results, "Code executed successfully"));
  } catch (error) {
    next(error);
  }
};
