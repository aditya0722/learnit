import express from "express";
import {
  createRootAssignmentController,
  deleteRootAssignmentController,
  getAssignmentController,
  getAssignmentsController,
  updateRootAssignmentController,
} from "./assignments.controller.js";

const AssignmentsRouter = express.Router();

AssignmentsRouter.get("/", getAssignmentsController);
AssignmentsRouter.get("/:id", getAssignmentController);
AssignmentsRouter.post("/", createRootAssignmentController);
AssignmentsRouter.patch("/:id", updateRootAssignmentController);
AssignmentsRouter.delete("/:id", deleteRootAssignmentController);

export default AssignmentsRouter;
