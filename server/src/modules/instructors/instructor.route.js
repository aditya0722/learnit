import express from "express";
import {
  applyController,
  getInstructorByUserController,
  getInstructorByIdController,
  getAllInstructorsController,
  getInstructorCoursesController,
  updateInstructorController,
  getMyCoursesController,
  getMyCourseDetailController,
  createMyCourseController,
  updateMyCourseController,
  deleteMyCourseController,
  getDashboardStatsController,
  getMyCourseDiscountsController,
  createMyCourseDiscountController,
  updateMyCourseDiscountController,
  deleteMyCourseDiscountController,
} from "./instructor.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import { upload } from "../../middleware/upload.middleware.js";

const InstructorsRouter = express.Router();

// Authenticated instructor routes (must be before /:id to avoid conflict)
InstructorsRouter.get("/me/stats", authenticate, authorize("instructor", "admin"), getDashboardStatsController);
InstructorsRouter.get("/me/courses", authenticate, authorize("instructor", "admin"), getMyCoursesController);
InstructorsRouter.get("/me/courses/:courseId", authenticate, authorize("instructor", "admin"), getMyCourseDetailController);
InstructorsRouter.post("/me/courses", authenticate, authorize("instructor", "admin"), upload.fields([{ name: "thumbnail", maxCount: 1 }]), createMyCourseController);
InstructorsRouter.patch("/me/courses/:courseId", authenticate, authorize("instructor", "admin"), upload.fields([{ name: "thumbnail", maxCount: 1 }]), updateMyCourseController);
InstructorsRouter.delete("/me/courses/:courseId", authenticate, authorize("instructor", "admin"), deleteMyCourseController);

// Instructor course discount management
InstructorsRouter.get("/me/courses/:courseId/discounts", authenticate, authorize("instructor", "admin"), getMyCourseDiscountsController);
InstructorsRouter.post("/me/courses/:courseId/discounts", authenticate, authorize("instructor", "admin"), createMyCourseDiscountController);
InstructorsRouter.patch("/me/courses/:courseId/discounts/:discountId", authenticate, authorize("instructor", "admin"), updateMyCourseDiscountController);
InstructorsRouter.delete("/me/courses/:courseId/discounts/:discountId", authenticate, authorize("instructor", "admin"), deleteMyCourseDiscountController);

// Public routes
InstructorsRouter.get("/", getAllInstructorsController);
InstructorsRouter.get("/user/:id", getInstructorByUserController);
InstructorsRouter.post("/apply/:userId", applyController);
InstructorsRouter.patch("/user/:id", updateInstructorController);
InstructorsRouter.get("/:id", getInstructorByIdController);
InstructorsRouter.get("/:id/courses", getInstructorCoursesController);

export default InstructorsRouter;
