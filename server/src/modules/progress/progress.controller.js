import { z } from "zod";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getCourseProgress, isChapterUnlocked, checkAndCompleteChapter, updateVideoProgress } from "./progress.service.js";

const courseIdSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

const chapterIdSchema = z.object({
  chapterId: z.coerce.number().int().positive(),
});

const videoProgressSchema = z.object({
  timeWatched: z.number().int().min(0),
  duration: z.number().int().min(1),
});

export const getCourseProgressController = async (req, res, next) => {
  try {
    const paramsResult = courseIdSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ApiError(400, "Invalid course ID");
    }

    const progress = await getCourseProgress(req.user.id, paramsResult.data.courseId);

    res
      .status(200)
      .json(new ApiResponse(200, progress, "Course progress fetched successfully"));
  } catch (error) {
    next(error);
  }
};

export const checkChapterUnlockedController = async (req, res, next) => {
  try {
    const courseResult = courseIdSchema.safeParse(req.params);
    const chapterResult = chapterIdSchema.safeParse(req.params);
    if (!courseResult.success || !chapterResult.success) {
      throw new ApiError(400, "Invalid course or chapter ID");
    }

    const unlocked = await isChapterUnlocked(
      req.user.id,
      courseResult.data.courseId,
      chapterResult.data.chapterId
    );

    res
      .status(200)
      .json(new ApiResponse(200, { unlocked }, "Chapter unlock status fetched"));
  } catch (error) {
    next(error);
  }
};

export const completeChapterController = async (req, res, next) => {
  try {
    const courseResult = courseIdSchema.safeParse(req.params);
    const chapterResult = chapterIdSchema.safeParse(req.params);
    if (!courseResult.success || !chapterResult.success) {
      throw new ApiError(400, "Invalid course or chapter ID");
    }

    const completed = await checkAndCompleteChapter(
      req.user.id,
      courseResult.data.courseId,
      chapterResult.data.chapterId
    );

    res
      .status(200)
      .json(new ApiResponse(200, { completed }, "Chapter completion checked"));
  } catch (error) {
    next(error);
  }
};

export const updateVideoProgressController = async (req, res, next) => {
  try {
    const courseResult = courseIdSchema.safeParse(req.params);
    const chapterResult = chapterIdSchema.safeParse(req.params);
    if (!courseResult.success || !chapterResult.success) {
      throw new ApiError(400, "Invalid course or chapter ID");
    }

    const bodyResult = videoProgressSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ApiError(400, "Invalid video progress data", bodyResult.error.issues);
    }

    const result = await updateVideoProgress(
      req.user.id,
      courseResult.data.courseId,
      chapterResult.data.chapterId,
      bodyResult.data.timeWatched,
      bodyResult.data.duration
    );

    res
      .status(200)
      .json(new ApiResponse(200, result, "Video progress updated"));
  } catch (error) {
    next(error);
  }
};
