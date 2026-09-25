import express from "express";
import {
  getCourseProgressController,
  checkChapterUnlockedController,
  completeChapterController,
  updateVideoProgressController,
} from "./progress.controller.js";

const ProgressRouter = express.Router({ mergeParams: true });

ProgressRouter.get("/courses/:courseId/progress", getCourseProgressController);
ProgressRouter.get("/courses/:courseId/chapters/:chapterId/unlocked", checkChapterUnlockedController);
ProgressRouter.post("/courses/:courseId/chapters/:chapterId/complete", completeChapterController);
ProgressRouter.post("/courses/:courseId/chapters/:chapterId/video", updateVideoProgressController);

export default ProgressRouter;
