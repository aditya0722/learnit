import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isRefreshEndpoint = originalRequest.url?.includes("/auth/refresh");
    const isLoginEndpoint = originalRequest.url?.includes("/auth/login");
    const isRegisterEndpoint = originalRequest.url?.includes("/auth/register");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshEndpoint &&
      !isLoginEndpoint &&
      !isRegisterEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiError {
  statusCode: number;
  message: string;
  errors: { path: (string | number)[]; message: string }[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  role: "learner" | "instructor" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  age: number;
}

export const authApi = {
  login: async (data: LoginRequest) => {
    const res = await api.post<{ statusCode: number; data: User; message: string }>(
      "/auth/login",
      data
    );
    return res.data;
  },

  register: async (data: RegisterRequest) => {
    const res = await api.post<{ statusCode: number; data: User; message: string }>(
      "/auth/register",
      data
    );
    return res.data;
  },

  refresh: async () => {
    const res = await api.post<{ statusCode: number; data: User; message: string }>(
      "/auth/refresh"
    );
    return res.data;
  },

  logout: async () => {
    const res = await api.post<{ statusCode: number; message: string }>(
      "/auth/logout"
    );
    return res.data;
  },

  me: async () => {
    const res = await api.get<{ statusCode: number; data: User; message: string }>(
      "/auth/me"
    );
    return res.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await api.post<{ statusCode: number; message: string }>(
      "/auth/change-password",
      data
    );
    return res.data;
  },

  resetPasswordRequest: async (data: { email: string }) => {
    const res = await api.post<{ statusCode: number; message: string }>(
      "/auth/reset-password-request",
      data
    );
    return res.data;
  },

  resetPasswordConfirm: async (data: { token: string; newPassword: string }) => {
    const res = await api.post<{ statusCode: number; message: string }>(
      "/auth/reset-password-confirm",
      data
    );
    return res.data;
  },
};

export interface Course {
  id: number;
  name: string;
  topics: string[];
  duration: number;
  price: string;
  thumbnail: string;
  instructorId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: number;
  chapterName: string;
  courseId: number;
  chapterNumber: number;
  thumbnail: string;
  videoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseTaken {
  id: number;
  price: string;
  courseId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string | null;
  chapter: number;
  questions: AssignmentQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentQuestion {
  id?: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  questionType?: "mcq" | "true_false" | "text_answer" | "code";
  correctAnswer?: string;
  codeLanguage?: "javascript" | "python" | "java" | "cpp";
  testCases?: { input: string; expectedOutput: string; hidden?: boolean }[];
  points?: number;
  explanation?: string;
}

export interface Submission {
  id: number;
  assignmentId: number;
  userId: number;
  score: number;
  totalPoints: number;
  submittedAt: string;
}

export interface SubmissionAnswer {
  id: number;
  submissionId: number;
  questionId: number;
  answer: string;
  isCorrect: number;
  pointsEarned: number;
  output: string | null;
  error: string | null;
  question?: {
    questionText: string;
    questionType: string;
    options: string[];
    correctOptionIndex: number;
    correctAnswer: string | null;
    explanation: string | null;
    points: number;
    testCases: { input: string; expectedOutput: string }[] | null;
    codeLanguage: string | null;
  };
}

export interface SubmissionResult {
  submission: Submission;
  answers: SubmissionAnswer[];
}

export interface Discount {
  id: number;
  courseId: number;
  discount: string;
  couponCode: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

export const courseApi = {
  getAll: async () => {
    const res = await api.get<{ data: Course[] }>("/course");
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await api.get<{ data: Course }>(`/course/${id}`);
    return res.data.data;
  },

  getChapters: async (courseId: number) => {
    const res = await api.get<{ data: Chapter[] }>(
      `/course/${courseId}/chapters`
    );
    return res.data.data;
  },

  buy: async (userId: number, courseId: number, price: number) => {
    const res = await api.post<{ message: string }>("/course/buy", {
      userId,
      courseId,
      price,
    });
    return res.data;
  },
};

export const courseTakenApi = {
  getAll: async () => {
    const res = await api.get<{ data: CourseTaken[] }>("/course-taken");
    return res.data.data;
  },

  getByUser: async (userId: number) => {
    const res = await api.get<{ data: CourseTaken[] }>("/course-taken");
    return res.data.data.filter((ct) => ct.userId === userId);
  },

  getById: async (id: number) => {
    const res = await api.get<{ data: CourseTaken }>(`/course-taken/${id}`);
    return res.data.data;
  },

  create: async (data: { userId: number; courseId: number; price: number }) => {
    const res = await api.post<{ message: string }>("/course-taken", data);
    return res.data;
  },
};

export const assignmentApi = {
  getByChapter: async (chapterId: number) => {
    const res = await api.get<{ data: Assignment[] }>(
      `/chapters/${chapterId}/assignments`
    );
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await api.get<{ data: Assignment }>(
      `/assignments/${id}`
    );
    return res.data.data;
  },

  create: async (chapterId: number, data: { title: string; description?: string; questions?: {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    questionType?: string;
    correctAnswer?: string;
    codeLanguage?: string;
    testCases?: { input: string; expectedOutput: string; hidden?: boolean }[];
    points?: number;
    explanation?: string;
  }[] }) => {
    const res = await api.post<{ data: Assignment; message: string }>(
      `/chapters/${chapterId}/assignments`,
      data
    );
    return res.data;
  },

  update: async (chapterId: number, assignmentId: number, data: { title?: string; description?: string | null; questions?: {
    id?: number;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    questionType?: string;
    correctAnswer?: string;
    codeLanguage?: string;
    testCases?: { input: string; expectedOutput: string; hidden?: boolean }[];
    points?: number;
    explanation?: string;
  }[] }) => {
    const res = await api.patch<{ data: Assignment; message: string }>(
      `/chapters/${chapterId}/assignments/${assignmentId}`,
      data
    );
    return res.data;
  },

  delete: async (chapterId: number, assignmentId: number) => {
    const res = await api.delete<{ message: string }>(
      `/chapters/${chapterId}/assignments/${assignmentId}`
    );
    return res.data;
  },
};

export const userApi = {
  getById: async (id: number) => {
    const res = await api.get<{ data: User }>(`/users/${id}`);
    return res.data.data;
  },

  update: async (id: number, data: Partial<Pick<User, "name" | "email" | "age">>) => {
    const res = await api.patch<{ data: User }>(`/users/${id}`, data);
    return res.data.data;
  },
};

export interface InstructorProfile {
  id: number;
  userId: number;
  bio: string | null;
  headline: string | null;
  expertise: string | null;
  experienceYears: number | null;
  profileImage: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstructorWithUser extends InstructorProfile {
  user: User;
}

export interface ApplyInstructorRequest {
  bio: string;
  headline: string;
  expertise: string;
  experienceYears: number;
  website?: string;
  linkedin?: string;
  github?: string;
}

export const instructorApi = {
  apply: async (userId: number, data: ApplyInstructorRequest) => {
    const res = await api.post<{ data: InstructorProfile; message: string }>(
      `/instructors/apply/${userId}`,
      data
    );
    return res.data;
  },

  getByUserId: async (userId: number) => {
    const res = await api.get<{ data: InstructorProfile | null }>(
      `/instructors/user/${userId}`
    );
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await api.get<{ data: InstructorWithUser }>(
      `/instructors/${id}`
    );
    return res.data.data;
  },

  getAll: async () => {
    const res = await api.get<{ data: InstructorProfile[] }>(`/instructors`);
    return res.data.data;
  },

  getCourses: async (instructorId: number) => {
    const res = await api.get<{ data: Course[] }>(
      `/instructors/${instructorId}/courses`
    );
    return res.data.data;
  },

  update: async (userId: number, data: Partial<ApplyInstructorRequest>) => {
    const res = await api.patch<{ data: InstructorProfile }>(
      `/instructors/user/${userId}`,
      data
    );
    return res.data.data;
  },
};

// ─── Admin API ────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalInstructors: number;
  totalRevenue: number;
  recentEnrollments: {
    id: number;
    price: string;
    createdAt: string;
    userName: string;
    userEmail: string;
    courseName: string;
  }[];
  roleBreakdown: { role: string; value: number }[];
}

export interface AdminInstructor {
  id: number;
  userId: number;
  bio: string | null;
  headline: string | null;
  expertise: string | null;
  experienceYears: number | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
}

export interface InstructorApplication {
  id: number;
  userId: number;
  status: "pending" | "approved" | "rejected";
  bio: string | null;
  headline: string | null;
  expertise: string | null;
  experienceYears: number | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
  userAge: number;
  userRole: string;
  userCreatedAt: string;
}

export interface InstructorApplicationDetail extends InstructorApplication {
  enrolledCourses: number;
  coursesCreated: number;
  userCourses: Course[];
}

export interface InstructorCourseWithStats {
  id: number;
  name: string;
  topics: string[];
  duration: number;
  price: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  enrollmentCount: number;
  revenue: number;
}

export interface InstructorCourseDetail extends InstructorCourseWithStats {
  instructorId: number;
  chaptersCount: number;
  chapters: Chapter[];
}

export const adminApi = {
  // Dashboard
  getDashboard: async () => {
    const res = await api.get<{ data: AdminDashboardStats }>("/admin/dashboard");
    return res.data.data;
  },

  // Users
  getUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
    const res = await api.get<{ data: { users: User[]; pagination: Pagination } }>(
      "/admin/users",
      { params }
    );
    return res.data.data;
  },

  getUser: async (id: number) => {
    const res = await api.get<{ data: User }>(`/admin/users/${id}`);
    return res.data.data;
  },

  updateUserRole: async (id: number, role: string) => {
    const res = await api.patch<{ data: User }>(`/admin/users/${id}/role`, { role });
    return res.data.data;
  },

  deleteUser: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/admin/users/${id}`);
    return res.data;
  },

  // Courses
  getCourses: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get<{ data: { courses: Course[]; pagination: Pagination } }>(
      "/admin/courses",
      { params }
    );
    return res.data.data;
  },

  getCourse: async (id: number) => {
    const res = await api.get<{ data: { course: Course; chapters: number; enrollments: number; revenue: number } }>(
      `/admin/courses/${id}`
    );
    return res.data.data;
  },

  deleteCourse: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/admin/courses/${id}`);
    return res.data;
  },

  // Instructors
  getInstructors: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get<{ data: { instructors: AdminInstructor[]; pagination: Pagination } }>(
      "/admin/instructors",
      { params }
    );
    return res.data.data;
  },

  getInstructor: async (id: number) => {
    const res = await api.get<{ data: AdminInstructor & { courseCount: number } }>(
      `/admin/instructors/${id}`
    );
    return res.data.data;
  },

  deleteInstructor: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/admin/instructors/${id}`);
    return res.data;
  },

  // Applications
  getApplications: async () => {
    const res = await api.get<{ data: InstructorApplication[] }>("/admin/applications");
    return res.data.data;
  },

  getApplicationDetail: async (id: number) => {
    const res = await api.get<{ data: InstructorApplicationDetail }>(`/admin/applications/${id}`);
    return res.data.data;
  },

  approveApplication: async (id: number) => {
    const res = await api.post<{ message: string }>(`/admin/applications/${id}/approve`);
    return res.data;
  },

  rejectApplication: async (id: number) => {
    const res = await api.post<{ message: string }>(`/admin/applications/${id}/reject`);
    return res.data;
  },
};

// ─── Instructor Course API ────────────────────────────────

export const instructorCourseApi = {
  getMyCourses: async () => {
    const res = await api.get<{ data: InstructorCourseWithStats[] }>("/instructors/me/courses");
    return res.data.data;
  },

  getMyCourseDetail: async (courseId: number) => {
    const res = await api.get<{ data: InstructorCourseDetail }>(`/instructors/me/courses/${courseId}`);
    return res.data.data;
  },

  createCourse: async (formData: FormData) => {
    const res = await api.post<{ data: Course; message: string }>("/instructors/me/courses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updateCourse: async (courseId: number, formData: FormData) => {
    const res = await api.patch<{ data: Course; message: string }>(`/instructors/me/courses/${courseId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  deleteCourse: async (courseId: number) => {
    const res = await api.delete<{ message: string }>(`/instructors/me/courses/${courseId}`);
    return res.data;
  },
};

export const chapterApi = {
  getByCourse: async (courseId: number) => {
    const res = await api.get<{ data: Chapter[] }>(`/course/${courseId}/chapters`);
    return res.data.data;
  },

  create: async (courseId: number, formData: FormData) => {
    const res = await api.post<{ message: string }>(`/course/${courseId}/chapters`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  update: async (courseId: number, chapterId: number, data: Partial<{ chapterName: string; chapterNumber: number; thumbnail: string; videoUrl: string }>) => {
    const res = await api.put<{ message: string }>(`/course/${courseId}/chapters/${chapterId}`, data);
    return res.data;
  },

  delete: async (courseId: number, chapterId: number) => {
    const res = await api.delete<{ message: string }>(`/course/${courseId}/chapters/${chapterId}`);
    return res.data;
  },
};

export const discountApi = {
  getByCourse: async (courseId: number) => {
    const res = await api.get<{ data: Discount | null }>(`/discounts/course/${courseId}`);
    return res.data.data;
  },

  create: async (data: { courseId: number; discount: number; couponCode?: string; expiresAt?: string; maxUses?: number }) => {
    const res = await api.post<{ data: Discount; message: string }>("/discounts", data);
    return res.data;
  },

  update: async (id: number, data: { discount?: number; couponCode?: string | null; expiresAt?: string | null; maxUses?: number | null }) => {
    const res = await api.patch<{ data: Discount; message: string }>(`/discounts/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await api.delete<{ message: string }>(`/discounts/${id}`);
    return res.data;
  },
};

// ─── Submission API ─────────────────────────────────────

export interface CodeRunResult {
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  isCorrect: boolean;
  error: string | null;
}

export const submissionApi = {
  submit: async (assignmentId: number, answers: { questionId: number; answer: string }[]) => {
    const res = await api.post<{ data: SubmissionResult; message: string }>(
      `/assignments/${assignmentId}/submit`,
      { answers }
    );
    return res.data.data;
  },

  getByAssignment: async (assignmentId: number) => {
    const res = await api.get<{ data: Submission[] }>(
      `/assignments/${assignmentId}/submissions`
    );
    return res.data.data;
  },

  getDetail: async (submissionId: number) => {
    const res = await api.get<{ data: { submission: Submission; answers: SubmissionAnswer[] } }>(
      `/submissions/${submissionId}`
    );
    return res.data.data;
  },

  runCode: async (code: string, language: string, testCases: { input: string; expectedOutput: string; hidden?: boolean }[]) => {
    const res = await api.post<{ data: CodeRunResult[]; message: string }>(
      `/run-code`,
      { code, language, testCases }
    );
    return res.data.data;
  },
};

export interface ChapterProgress {
  chapterId: number;
  chapterNumber: number;
  isCompleted: boolean;
  completedAt: string | null;
  videoTimeWatched: number;
  videoDuration: number;
  isVideoWatched: boolean;
}

export const progressApi = {
  getCourseProgress: async (courseId: number) => {
    const res = await api.get<{ data: ChapterProgress[]; message: string }>(
      `/courses/${courseId}/progress`
    );
    return res.data.data;
  },

  checkChapterUnlocked: async (courseId: number, chapterId: number) => {
    const res = await api.get<{ data: { unlocked: boolean }; message: string }>(
      `/courses/${courseId}/chapters/${chapterId}/unlocked`
    );
    return res.data.data.unlocked;
  },

  completeChapter: async (courseId: number, chapterId: number) => {
    const res = await api.post<{ data: { completed: boolean }; message: string }>(
      `/courses/${courseId}/chapters/${chapterId}/complete`
    );
    return res.data.data.completed;
  },

  updateVideoProgress: async (courseId: number, chapterId: number, timeWatched: number, duration: number) => {
    const res = await api.post<{ data: { timeWatched: number; duration: number; isVideoWatched: boolean }; message: string }>(
      `/courses/${courseId}/chapters/${chapterId}/video`,
      { timeWatched, duration }
    );
    return res.data.data;
  },
};

export default api;
