import express from "express";
import {
  submitAssignmentController,
  getSubmissionsController,
  getSubmissionDetailController,
  runCodeController,
} from "./submissions.controller.js";
import { runCodeLimiter } from "../../middleware/rateLimiter.js";

const SubmissionsRouter = express.Router();

SubmissionsRouter.post("/assignments/:assignmentId/submit", submitAssignmentController);
SubmissionsRouter.get("/assignments/:assignmentId/submissions", getSubmissionsController);
SubmissionsRouter.get("/submissions/:submissionId", getSubmissionDetailController);
SubmissionsRouter.post("/run-code", runCodeLimiter, runCodeController);

export default SubmissionsRouter;
