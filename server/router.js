import express from "express";
import AuthRouter from "./src/modules/auth/auth.route.js";
import { CourseRouter } from "./src/modules/course/course.route.js";
import ChaptersRouter from "./src/modules/chapters/chapters.route.js";
import UsersRouter from "./src/modules/users/users.route.js";
import CourseTakenRouter from "./src/modules/courseTaken/courseTaken.route.js";
import DiscountsRouter from "./src/modules/discounts/discounts.route.js";
import AssignmentsRouter from "./src/modules/assignments/assignments.route.js";
import ChapterAssignmentsRouter from "./src/modules/assignments/chapterAssignments.route.js";
import InstructorsRouter from "./src/modules/instructors/instructor.route.js";
import AdminRouter from "./src/modules/admin/admin.route.js";
import SubmissionsRouter from "./src/modules/submissions/submissions.route.js";
import ProgressRouter from "./src/modules/progress/progress.route.js";
import { authenticate } from "./src/middleware/auth.js";
import { authorize } from "./src/middleware/rbac.js";

const routes = express.Router();

routes.use("/auth", AuthRouter);
routes.use("/users", authenticate, UsersRouter);
routes.use("/course", CourseRouter);
routes.use("/course-taken", authenticate, CourseTakenRouter);
routes.use("/discounts", authenticate, authorize("admin", "instructor"), DiscountsRouter);
routes.use("/assignments", authenticate, AssignmentsRouter);
routes.use("/instructors", InstructorsRouter);
routes.use("/admin", authenticate, authorize("admin"), AdminRouter);
routes.use("/course/:courseId/chapters", ChaptersRouter);
routes.use("/chapters/:chapterId/assignments", authenticate, ChapterAssignmentsRouter);
routes.use("/chapters/:courseId", ChaptersRouter);
routes.use("/", authenticate, SubmissionsRouter);
routes.use("/", authenticate, ProgressRouter);

export default routes;
