import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllCourses,
  getCourseById,
  deleteCourse,
  getCourseStats,
  getAllInstructors,
  getInstructorById,
  deleteInstructor,
} from "./admin.service.js";
import {
  getPendingInstructors,
  getInstructorProfileDetail,
  approveInstructor,
  rejectInstructor,
} from "../instructors/instructor.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const dashboardStatsController = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    return res.status(200).json(new ApiResponse(200, stats, "Dashboard stats fetched"));
  } catch (e) {
    next(e);
  }
};

// ─── Users ────────────────────────────────────────────────

export const listUsersController = async (req, res, next) => {
  try {
    const { page, limit, search, role } = req.query;
    const result = await getAllUsers({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
      role,
    });
    return res.status(200).json(new ApiResponse(200, result, "Users fetched"));
  } catch (e) {
    next(e);
  }
};

export const getUserController = async (req, res, next) => {
  try {
    const user = await getUserById(Number(req.params.id));
    return res.status(200).json(new ApiResponse(200, user, "User fetched"));
  } catch (e) {
    next(e);
  }
};

export const updateUserRoleController = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !["learner", "instructor", "admin"].includes(role)) {
      throw new ApiError(400, "Invalid role");
    }
    const user = await updateUserRole(Number(req.params.id), role);
    return res.status(200).json(new ApiResponse(200, user, "User role updated"));
  } catch (e) {
    next(e);
  }
};

export const deleteUserController = async (req, res, next) => {
  try {
    await deleteUser(Number(req.params.id));
    return res.status(200).json(new ApiResponse(200, null, "User deleted"));
  } catch (e) {
    next(e);
  }
};

// ─── Courses ──────────────────────────────────────────────

export const listCoursesController = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await getAllCourses({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
    });
    return res.status(200).json(new ApiResponse(200, result, "Courses fetched"));
  } catch (e) {
    next(e);
  }
};

export const getCourseController = async (req, res, next) => {
  try {
    const result = await getCourseStats(Number(req.params.id));
    return res.status(200).json(new ApiResponse(200, result, "Course fetched"));
  } catch (e) {
    next(e);
  }
};

export const deleteCourseController = async (req, res, next) => {
  try {
    await deleteCourse(Number(req.params.id));
    return res.status(200).json(new ApiResponse(200, null, "Course deleted"));
  } catch (e) {
    next(e);
  }
};

// ─── Instructors ──────────────────────────────────────────

export const listInstructorsController = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await getAllInstructors({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search,
    });
    return res.status(200).json(new ApiResponse(200, result, "Instructors fetched"));
  } catch (e) {
    next(e);
  }
};

export const getInstructorController = async (req, res, next) => {
  try {
    const result = await getInstructorById(Number(req.params.id));
    return res.status(200).json(new ApiResponse(200, result, "Instructor fetched"));
  } catch (e) {
    next(e);
  }
};

export const deleteInstructorController = async (req, res, next) => {
  try {
    await deleteInstructor(Number(req.params.id));
    return res.status(200).json(new ApiResponse(200, null, "Instructor removed"));
  } catch (e) {
    next(e);
  }
};

// ─── Instructor Applications ──────────────────────────────

export const listPendingInstructorsController = async (req, res, next) => {
  try {
    const result = await getPendingInstructors();
    return res.status(200).json(new ApiResponse(200, result, "Pending applications fetched"));
  } catch (e) {
    next(e);
  }
};

export const getInstructorProfileDetailController = async (req, res, next) => {
  try {
    const result = await getInstructorProfileDetail(Number(req.params.id));
    return res.status(200).json(new ApiResponse(200, result, "Profile detail fetched"));
  } catch (e) {
    next(e);
  }
};

export const approveInstructorController = async (req, res, next) => {
  try {
    const result = await approveInstructor(Number(req.params.id));
    return res.status(200).json(new ApiResponse(200, result, "Instructor approved"));
  } catch (e) {
    next(e);
  }
};

export const rejectInstructorController = async (req, res, next) => {
  try {
    const result = await rejectInstructor(Number(req.params.id));
    return res.status(200).json(new ApiResponse(200, result, "Instructor rejected"));
  } catch (e) {
    next(e);
  }
};
