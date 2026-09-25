import express from "express";
import {
  createCourseTakenController,
  deleteCourseTakenController,
  getCourseTakenByIdController,
  getCourseTakenController,
  updateCourseTakenController,
} from "./courseTaken.controller.js";

const CourseTakenRouter = express.Router();

CourseTakenRouter.get("/", getCourseTakenController);
CourseTakenRouter.get("/:id", getCourseTakenByIdController);
CourseTakenRouter.post("/", createCourseTakenController);
CourseTakenRouter.patch("/:id", updateCourseTakenController);
CourseTakenRouter.delete("/:id", deleteCourseTakenController);

export default CourseTakenRouter;
