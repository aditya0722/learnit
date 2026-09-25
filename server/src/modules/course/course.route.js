import { AddCourse,RemoveCourse,EditCourse,BuyCourse,getAllCourse,getCourseById } from "./course.controller.js";
import { upload } from "../../middleware/upload.middleware.js";
import { authenticate } from "../../middleware/auth.js";
import express from "express";

export const CourseRouter = express.Router();

CourseRouter.get("/",getAllCourse);
CourseRouter.get("/:id",getCourseById);

CourseRouter.post("/",upload.fields([{ name: "thumbnail", maxCount: 1 }]),AddCourse);
CourseRouter.delete("/:id",RemoveCourse);
CourseRouter.patch("/:id",EditCourse);

CourseRouter.post("/buy", authenticate, BuyCourse);

