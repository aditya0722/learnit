import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  applyInstructorSchema,
  instructorIdSchema,
  userIdSchema,
  createCourseSchema,
  createDiscountSchema,
  updateDiscountSchema,
} from "../../middleware/validation.js";
import {
  applyAsInstructor,
  getInstructorByUserId,
  getInstructorWithUser,
  getAllInstructors,
  getInstructorCourses,
  updateInstructorProfile,
  getInstructorCoursesWithStats,
  getInstructorCourseDetail,
  createMyCourse,
  updateMyCourse,
  deleteMyCourse,
  getInstructorDashboardStats,
  getMyCourseDiscounts,
  createMyCourseDiscount,
  updateMyCourseDiscount,
  deleteMyCourseDiscount,
} from "./instructor.service.js";

const validationError = (issues) => new ApiError(400, "Validation failed", issues);

export const applyController = async (req, res, next) => {
  try {
    const result = applyInstructorSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    const userId = Number(req.params.userId);
    const profile = await applyAsInstructor(userId, result.data);
    res.status(201).json(new ApiResponse(201, profile, "Instructor application accepted"));
  } catch (error) {
    next(error);
  }
};

export const getInstructorByUserController = async (req, res, next) => {
  try {
    const result = userIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    const profile = await getInstructorByUserId(result.data.id);
    res.status(200).json(new ApiResponse(200, profile, "Instructor profile fetched"));
  } catch (error) {
    next(error);
  }
};

export const getInstructorByIdController = async (req, res, next) => {
  try {
    const result = instructorIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    const instructor = await getInstructorWithUser(result.data.id);
    res.status(200).json(new ApiResponse(200, instructor, "Instructor fetched"));
  } catch (error) {
    next(error);
  }
};

export const getAllInstructorsController = async (req, res, next) => {
  try {
    const instructors = await getAllInstructors();
    res.status(200).json(new ApiResponse(200, instructors, "Instructors fetched"));
  } catch (error) {
    next(error);
  }
};

export const getInstructorCoursesController = async (req, res, next) => {
  try {
    const result = instructorIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    const courses = await getInstructorCourses(result.data.id);
    res.status(200).json(new ApiResponse(200, courses, "Instructor courses fetched"));
  } catch (error) {
    next(error);
  }
};

export const updateInstructorController = async (req, res, next) => {
  try {
    const result = userIdSchema.safeParse(req.params);
    if (!result.success) throw validationError(result.error.issues);

    const profile = await updateInstructorProfile(result.data.id, req.body);
    res.status(200).json(new ApiResponse(200, profile, "Instructor profile updated"));
  } catch (error) {
    next(error);
  }
};

export const getMyCoursesController = async (req, res, next) => {
  try {
    const courses = await getInstructorCoursesWithStats(req.user.id);
    res.status(200).json(new ApiResponse(200, courses, "Instructor courses fetched"));
  } catch (error) {
    next(error);
  }
};

export const getMyCourseDetailController = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const course = await getInstructorCourseDetail(req.user.id, courseId);
    res.status(200).json(new ApiResponse(200, course, "Course detail fetched"));
  } catch (error) {
    next(error);
  }
};

export const createMyCourseController = async (req, res, next) => {
  try {
    const fileThumbnail = req.files?.thumbnail?.[0]?.path;
    const result = createCourseSchema.safeParse({
      ...req.body,
      thumbnail: fileThumbnail || req.body.thumbnail,
    });

    if (!result.success) throw validationError(result.error.issues);

    const course = await createMyCourse(req.user.id, result.data);
    res.status(201).json(new ApiResponse(201, course, "Course created successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateMyCourseController = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const fileThumbnail = req.files?.thumbnail?.[0]?.path;

    const bodyData = { ...req.body };
    if (fileThumbnail) bodyData.thumbnail = fileThumbnail;
    if (bodyData.topics && typeof bodyData.topics === "string") {
      try { bodyData.topics = JSON.parse(bodyData.topics); } catch { /* keep as-is */ }
    }

    const updateCourseSchema = (await import("../../middleware/validation.js")).updateCourseSchema;
    const result = updateCourseSchema.safeParse(bodyData);
    if (!result.success) throw validationError(result.error.issues);

    const course = await updateMyCourse(req.user.id, courseId, result.data);
    res.status(200).json(new ApiResponse(200, course, "Course updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteMyCourseController = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    await deleteMyCourse(req.user.id, courseId);
    res.status(200).json(new ApiResponse(200, null, "Course deleted successfully"));
  } catch (error) {
    next(error);
  }
};

export const getDashboardStatsController = async (req, res, next) => {
  try {
    const stats = await getInstructorDashboardStats(req.user.id);
    res.status(200).json(new ApiResponse(200, stats, "Dashboard stats fetched"));
  } catch (error) {
    next(error);
  }
};

export const getMyCourseDiscountsController = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const discounts = await getMyCourseDiscounts(req.user.id, courseId);
    res.status(200).json(new ApiResponse(200, discounts, "Discounts fetched"));
  } catch (error) {
    next(error);
  }
};

export const createMyCourseDiscountController = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const result = createDiscountSchema.safeParse({ ...req.body, courseId });
    if (!result.success) throw validationError(result.error.issues);

    const discount = await createMyCourseDiscount(req.user.id, courseId, result.data);
    res.status(201).json(new ApiResponse(201, discount, "Discount created successfully"));
  } catch (error) {
    next(error);
  }
};

export const updateMyCourseDiscountController = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const discountId = Number(req.params.discountId);
    const result = updateDiscountSchema.safeParse(req.body);
    if (!result.success) throw validationError(result.error.issues);

    const discount = await updateMyCourseDiscount(req.user.id, courseId, discountId, result.data);
    res.status(200).json(new ApiResponse(200, discount, "Discount updated successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteMyCourseDiscountController = async (req, res, next) => {
  try {
    const courseId = Number(req.params.courseId);
    const discountId = Number(req.params.discountId);
    await deleteMyCourseDiscount(req.user.id, courseId, discountId);
    res.status(200).json(new ApiResponse(200, null, "Discount deleted successfully"));
  } catch (error) {
    next(error);
  }
};
