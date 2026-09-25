import { eq, count, sql, desc } from "drizzle-orm";
import { db } from "../../index.js";
import { usersTable } from "../../db/schemas/users.js";
import { coursesTable } from "../../db/schemas/courses.js";
import { chaptersTable } from "../../db/schemas/chapters.js";
import { courseTakenTable } from "../../db/schemas/courseTaken.js";
import { instructorProfilesTable } from "../../db/schemas/instructorProfiles.js";
import { discountTable } from "../../db/schemas/discounts.js";
import { ApiError } from "../../utils/ApiError.js";

const publicUser = ({ password, ...user }) => user;

// ─── Dashboard Stats ──────────────────────────────────────

export const getDashboardStats = async () => {
  const [userCount] = await db.select({ value: count() }).from(usersTable);
  const [courseCount] = await db.select({ value: count() }).from(coursesTable);
  const [enrollmentCount] = await db.select({ value: count() }).from(courseTakenTable);
  const [instructorCount] = await db.select({ value: count() }).from(instructorProfilesTable);

  const [revenue] = await db
    .select({ value: sql`COALESCE(SUM(${courseTakenTable.price}::numeric), 0)` })
    .from(courseTakenTable);

  const recentEnrollments = await db
    .select({
      id: courseTakenTable.id,
      price: courseTakenTable.price,
      createdAt: courseTakenTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
      courseName: coursesTable.name,
    })
    .from(courseTakenTable)
    .innerJoin(usersTable, eq(courseTakenTable.userId, usersTable.id))
    .innerJoin(coursesTable, eq(courseTakenTable.courseId, coursesTable.id))
    .orderBy(desc(courseTakenTable.createdAt))
    .limit(10);

  const roleBreakdown = await db
    .select({ role: usersTable.role, value: count() })
    .from(usersTable)
    .groupBy(usersTable.role);

  return {
    totalUsers: userCount.value,
    totalCourses: courseCount.value,
    totalEnrollments: enrollmentCount.value,
    totalInstructors: instructorCount.value,
    totalRevenue: Number(revenue.value),
    recentEnrollments,
    roleBreakdown,
  };
};

// ─── Users Management ─────────────────────────────────────

export const getAllUsers = async ({ page = 1, limit = 20, search, role } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${usersTable.name} ILIKE ${`%${search}%`} OR ${usersTable.email} ILIKE ${`%${search}%`})`
    );
  }
  if (role) {
    conditions.push(eq(usersTable.role, role));
  }

  const where = conditions.length > 0 ? sql`${conditions[0]}` : undefined;

  let query = db.select().from(usersTable);
  if (where) query = query.where(where);

  const [users, [{ total }]] = await Promise.all([
    query.limit(limit).offset(offset).orderBy(desc(usersTable.createdAt)),
    db.select({ total: count() }).from(usersTable).where(where),
  ]);

  return {
    users: users.map(publicUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getUserById = async (id) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (users.length === 0) throw new ApiError(404, "User not found");
  return publicUser(users[0]);
};

export const updateUserRole = async (id, role) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (users.length === 0) throw new ApiError(404, "User not found");

  await db.update(usersTable).set({ role, updatedAt: new Date() }).where(eq(usersTable.id, id));
  const updated = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  return publicUser(updated[0]);
};

export const deleteUser = async (id) => {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (users.length === 0) throw new ApiError(404, "User not found");
  await db.delete(usersTable).where(eq(usersTable.id, id));
};

// ─── Courses Management ───────────────────────────────────

export const getAllCourses = async ({ page = 1, limit = 20, search } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];

  if (search) {
    conditions.push(sql`${coursesTable.name} ILIKE ${`%${search}%`}`);
  }

  const where = conditions.length > 0 ? sql`${conditions[0]}` : undefined;

  let query = db.select().from(coursesTable);
  if (where) query = query.where(where);

  const [courses, [{ total }]] = await Promise.all([
    query.limit(limit).offset(offset).orderBy(desc(coursesTable.createdAt)),
    db.select({ total: count() }).from(coursesTable).where(where),
  ]);

  return {
    courses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getCourseById = async (id) => {
  const courses = await db.select().from(coursesTable).where(eq(coursesTable.id, id)).limit(1);
  if (courses.length === 0) throw new ApiError(404, "Course not found");
  return courses[0];
};

export const deleteCourse = async (id) => {
  const courses = await db.select().from(coursesTable).where(eq(coursesTable.id, id)).limit(1);
  if (courses.length === 0) throw new ApiError(404, "Course not found");
  await db.delete(coursesTable).where(eq(coursesTable.id, id));
};

export const getCourseStats = async (id) => {
  const courses = await db.select().from(coursesTable).where(eq(coursesTable.id, id)).limit(1);
  if (courses.length === 0) throw new ApiError(404, "Course not found");

  const [chapterCount] = await db
    .select({ value: count() })
    .from(chaptersTable)
    .where(eq(chaptersTable.courseId, id));

  const [enrollmentCount] = await db
    .select({ value: count() })
    .from(courseTakenTable)
    .where(eq(courseTakenTable.courseId, id));

  const [revenue] = await db
    .select({ value: sql`COALESCE(SUM(${courseTakenTable.price}::numeric), 0)` })
    .from(courseTakenTable)
    .where(eq(courseTakenTable.courseId, id));

  return {
    course: courses[0],
    chapters: chapterCount.value,
    enrollments: enrollmentCount.value,
    revenue: Number(revenue.value),
  };
};

// ─── Instructors Management ───────────────────────────────

export const getAllInstructors = async ({ page = 1, limit = 20, search } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${usersTable.name} ILIKE ${`%${search}%`} OR ${usersTable.email} ILIKE ${`%${search}%`} OR ${instructorProfilesTable.expertise} ILIKE ${`%${search}%`})`
    );
  }

  const where = conditions.length > 0 ? sql`${conditions[0]}` : undefined;

  let query = db
    .select({
      id: instructorProfilesTable.id,
      userId: instructorProfilesTable.userId,
      bio: instructorProfilesTable.bio,
      headline: instructorProfilesTable.headline,
      expertise: instructorProfilesTable.expertise,
      experienceYears: instructorProfilesTable.experienceYears,
      website: instructorProfilesTable.website,
      linkedin: instructorProfilesTable.linkedin,
      github: instructorProfilesTable.github,
      createdAt: instructorProfilesTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(instructorProfilesTable)
    .innerJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id));

  if (where) query = query.where(where);

  const instructors = await query.limit(limit).offset(offset).orderBy(desc(instructorProfilesTable.createdAt));

  const [{ total }] = await db
    .select({ total: count() })
    .from(instructorProfilesTable);

  return {
    instructors,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getInstructorById = async (id) => {
  const result = await db
    .select({
      id: instructorProfilesTable.id,
      userId: instructorProfilesTable.userId,
      bio: instructorProfilesTable.bio,
      headline: instructorProfilesTable.headline,
      expertise: instructorProfilesTable.expertise,
      experienceYears: instructorProfilesTable.experienceYears,
      website: instructorProfilesTable.website,
      linkedin: instructorProfilesTable.linkedin,
      github: instructorProfilesTable.github,
      createdAt: instructorProfilesTable.createdAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(instructorProfilesTable)
    .innerJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
    .where(eq(instructorProfilesTable.id, id))
    .limit(1);

  if (result.length === 0) throw new ApiError(404, "Instructor not found");

  const [courseCount] = await db
    .select({ value: count() })
    .from(coursesTable)
    .where(eq(coursesTable.instructorId, id));

  return { ...result[0], courseCount: courseCount.value };
};

export const deleteInstructor = async (id) => {
  const result = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.id, id))
    .limit(1);
  if (result.length === 0) throw new ApiError(404, "Instructor not found");
  await db.delete(instructorProfilesTable).where(eq(instructorProfilesTable.id, id));
};
