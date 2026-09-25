import { AddCourse,RemoveCourse,EditCourse,BuyCourse,getAllCourse } from "./course.controller.js";
import { upload } from "../../middleware/upload.middleware.js";
import express from "express";

export const CourseRouter = express.Router();

CourseRouter.get("/",getAllCourse);

CourseRouter.post("/",upload.fields([{ name: "thumbnail", maxCount: 1 }]),AddCourse);
CourseRouter.delete("/:id",RemoveCourse);
CourseRouter.patch("/:id",EditCourse);

CourseRouter.post("/buy",BuyCourse);

