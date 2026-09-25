import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().min(13).max(120),
});

export const loginSchema=z.object({
  email:z.string().email(),
  password: z.string().min(8).max(100),
})

const parseTopics = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value.split(",").map((topic) => topic.trim());
  } catch {
    return value.split(",").map((topic) => topic.trim());
  }
};

export const createCourseSchema = z.object({
  name: z.string().min(2).max(255),
  topics: z.preprocess(parseTopics, z.array(z.string().min(1)).min(1)),
  duration: z.coerce.number().positive(),
  price: z.coerce.number().nonnegative(),
  thumbnail: z.string().min(1),
  instructorId: z.coerce.number().int().positive().optional(),
});

export const updateCourseSchema = createCourseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export const courseIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const buyCourseSchema = z.object({
  userId: z.coerce.number().int().positive(),
  courseId: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative(),
});

export const chapterParamsSchema = z.object({
  courseId: z.coerce.number().int().positive(),
});

export const chapterIdParamsSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  chapterId: z.coerce.number().int().positive(),
});

export const createChapterSchema = z.object({
  chapterName: z.string().min(2).max(255),
  chapterNumber: z.coerce.number().int().positive(),
  thumbnail: z.string().min(1),
  videoUrl: z.string().min(1),
});

export const updateChapterSchema = createChapterSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  age: z.coerce.number().int().min(13).max(120).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export const courseTakenIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createCourseTakenSchema = buyCourseSchema;

export const updateCourseTakenSchema = z.object({
  userId: z.coerce.number().int().positive().optional(),
  courseId: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().nonnegative().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export const discountIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createDiscountSchema = z.object({
  courseId: z.coerce.number().int().positive(),
  discount: z.coerce.number().min(0).max(100),
  couponCode: z.string().min(3).max(50).optional(),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
});

export const updateDiscountSchema = z.object({
  discount: z.coerce.number().min(0).max(100).optional(),
  couponCode: z.string().min(3).max(50).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxUses: z.coerce.number().int().positive().optional().nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export const assignmentParamsSchema = z.object({
  chapterId: z.coerce.number().int().positive(),
});

export const assignmentIdParamsSchema = z.object({
  chapterId: z.coerce.number().int().positive(),
  assignmentId: z.coerce.number().int().positive(),
});

export const assignmentIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createAssignmentSchema = z.object({
  chapter: z.coerce.number().int().positive().optional(),
  title: z.string().min(2).max(255),
  description: z.string().optional(),
  questions: z.array(z.object({
    questionText: z.string().min(1),
    options: z.array(z.string().min(1)).optional(),
    correctOptionIndex: z.coerce.number().int().min(0).optional(),
    questionType: z.enum(["mcq", "true_false", "text_answer", "code"]).optional(),
    correctAnswer: z.string().optional(),
    codeLanguage: z.enum(["javascript", "python", "java", "cpp"]).optional(),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string(),
      hidden: z.boolean().optional(),
    })).optional(),
    points: z.coerce.number().int().positive().optional(),
    explanation: z.string().optional(),
  })).optional(),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().optional().nullable(),
  questions: z.array(z.object({
    id: z.coerce.number().int().positive().optional(),
    questionText: z.string().min(1),
    options: z.array(z.string().min(1)).optional(),
    correctOptionIndex: z.coerce.number().int().min(0).optional(),
    questionType: z.enum(["mcq", "true_false", "text_answer", "code"]).optional(),
    correctAnswer: z.string().optional(),
    codeLanguage: z.enum(["javascript", "python", "java", "cpp"]).optional(),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string(),
      hidden: z.boolean().optional(),
    })).optional(),
    points: z.coerce.number().int().positive().optional(),
    explanation: z.string().optional(),
  })).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

// Instructor schemas
export const applyInstructorSchema = z.object({
  bio: z.string().min(10).max(1000),
  headline: z.string().min(2).max(255),
  expertise: z.string().min(2).max(255),
  experienceYears: z.coerce.number().int().min(0).max(50),
  website: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
});

export const instructorIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Auth schemas
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});
