import express from "express";
import {
  dashboardStatsController,
  listUsersController,
  getUserController,
  updateUserRoleController,
  deleteUserController,
  listCoursesController,
  getCourseController,
  deleteCourseController,
  listInstructorsController,
  getInstructorController,
  deleteInstructorController,
  listPendingInstructorsController,
  getInstructorProfileDetailController,
  approveInstructorController,
  rejectInstructorController,
} from "./admin.controller.js";

const AdminRouter = express.Router();

// Dashboard
AdminRouter.get("/dashboard", dashboardStatsController);

// Users
AdminRouter.get("/users", listUsersController);
AdminRouter.get("/users/:id", getUserController);
AdminRouter.patch("/users/:id/role", updateUserRoleController);
AdminRouter.delete("/users/:id", deleteUserController);

// Courses
AdminRouter.get("/courses", listCoursesController);
AdminRouter.get("/courses/:id", getCourseController);
AdminRouter.delete("/courses/:id", deleteCourseController);

// Instructors
AdminRouter.get("/instructors", listInstructorsController);
AdminRouter.get("/instructors/:id", getInstructorController);
AdminRouter.delete("/instructors/:id", deleteInstructorController);

// Instructor Applications
AdminRouter.get("/applications", listPendingInstructorsController);
AdminRouter.get("/applications/:id", getInstructorProfileDetailController);
AdminRouter.post("/applications/:id/approve", approveInstructorController);
AdminRouter.post("/applications/:id/reject", rejectInstructorController);

export default AdminRouter;
