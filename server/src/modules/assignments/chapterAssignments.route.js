import express from "express";
import {
  createAssignmentController,
  deleteAssignmentController,
  getAssignmentsByChapterController,
  updateAssignmentController,
} from "./assignments.controller.js";

const ChapterAssignmentsRouter = express.Router({ mergeParams: true });

ChapterAssignmentsRouter.get("/", getAssignmentsByChapterController);
ChapterAssignmentsRouter.post("/", createAssignmentController);
ChapterAssignmentsRouter.patch("/:assignmentId", updateAssignmentController);
ChapterAssignmentsRouter.delete("/:assignmentId", deleteAssignmentController);

export default ChapterAssignmentsRouter;
