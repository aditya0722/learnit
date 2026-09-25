import { eq, sql } from "drizzle-orm";
import { db } from "../../index.js";
import { instructorProfilesTable } from "../../db/schemas/instructorProfiles.js";
import { usersTable } from "../../db/schemas/users.js";
import { coursesTable } from "../../db/schemas/courses.js";
import { courseTakenTable } from "../../db/schemas/courseTaken.js";
import { chaptersTable } from "../../db/schemas/chapters.js";
import { discountTable } from "../../db/schemas/discounts.js";
import { ApiError } from "../../utils/ApiError.js";

const publicUser = ({ password, ...user }) => user;

export const getInstructorCoursesWithStats = async (userId) => {
  const profiles = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.userId, userId))
    .limit(1);

  if (profiles.length === 0) throw new ApiError(404, "Instructor profile not found");
  const profileId = profiles[0].id;

  const courses = await db
    .select({
      id: coursesTable.id,
      name: coursesTable.name,
      topics: coursesTable.topics,
      duration: coursesTable.duration,
      price: coursesTable.price,
      thumbnail: coursesTable.thumbnail,
      createdAt: coursesTable.createdAt,
      updatedAt: coursesTable.updatedAt,
      enrollmentCount: sql`cast(count(${courseTakenTable.id}) as int)`,
      revenue: sql`coalesce(cast(sum(cast(${courseTakenTable.price} as numeric)) as numeric(10,2)), 0)`,
    })
    .from(coursesTable)
    .leftJoin(courseTakenTable, eq(coursesTable.id, courseTakenTable.courseId))
    .where(eq(coursesTable.instructorId, profileId))
    .groupBy(coursesTable.id)
    .orderBy(coursesTable.createdAt);

  return courses;
};

export const getInstructorCourseDetail = async (userId, courseId) => {
  const profiles = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.userId, userId))
    .limit(1);

  if (profiles.length === 0) throw new ApiError(404, "Instructor profile not found");

  const courseRows = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId))
    .limit(1);

  if (courseRows.length === 0) throw new ApiError(404, "Course not found");
  if (courseRows[0].instructorId !== profiles[0].id) {
    throw new ApiError(403, "You don't own this course");
  }

  const course = courseRows[0];

  const [stats] = await db
    .select({
      enrollmentCount: sql`cast(count(${courseTakenTable.id}) as int)`,
      revenue: sql`coalesce(cast(sum(cast(${courseTakenTable.price} as numeric)) as numeric(10,2)), 0)`,
    })
    .from(courseTakenTable)
    .where(eq(courseTakenTable.courseId, courseId));

  const chapters = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.courseId, courseId))
    .orderBy(chaptersTable.chapterNumber);

  return {
    ...course,
    enrollmentCount: stats?.enrollmentCount || 0,
    revenue: Number(stats?.revenue || 0),
    chaptersCount: chapters.length,
    chapters,
  };
};

export const createMyCourse = async (userId, data) => {
  const profiles = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.userId, userId))
    .limit(1);

  if (profiles.length === 0) throw new ApiError(404, "Instructor profile not found");
  if (profiles[0].status !== "approved") {
    throw new ApiError(403, "Your instructor profile is not approved yet");
  }

  const [course] = await db
    .insert(coursesTable)
    .values({
      name: data.name,
      topics: data.topics,
      duration: String(data.duration),
      price: String(data.price),
      thumbnail: data.thumbnail,
      instructorId: profiles[0].id,
    })
    .returning();

  return course;
};

export const applyAsInstructor = async (userId, data) => {
  const existing = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.userId, userId));

  if (existing.length > 0) {
    throw new ApiError(409, "You already have an instructor profile");
  }

  const [profile] = await db
    .insert(instructorProfilesTable)
    .values({
      userId,
      status: "pending",
      bio: data.bio,
      headline: data.headline,
      expertise: data.expertise,
      experienceYears: data.experienceYears,
      website: data.website || null,
      linkedin: data.linkedin || null,
      github: data.github || null,
    })
    .returning();

  return profile;
};

export const approveInstructor = async (profileId) => {
  const profiles = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.id, profileId))
    .limit(1);

  if (profiles.length === 0) throw new ApiError(404, "Instructor profile not found");

  const profile = profiles[0];

  if (profile.status === "approved") {
    throw new ApiError(400, "Instructor is already approved");
  }

  await db
    .update(instructorProfilesTable)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(instructorProfilesTable.id, profileId));

  await db
    .update(usersTable)
    .set({ role: "instructor", updatedAt: new Date() })
    .where(eq(usersTable.id, profile.userId));

  return { ...profile, status: "approved" };
};

export const rejectInstructor = async (profileId) => {
  const profiles = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.id, profileId))
    .limit(1);

  if (profiles.length === 0) throw new ApiError(404, "Instructor profile not found");

  const profile = profiles[0];

  if (profile.status === "rejected") {
    throw new ApiError(400, "Instructor is already rejected");
  }

  await db
    .update(instructorProfilesTable)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(instructorProfilesTable.id, profileId));

  return { ...profile, status: "rejected" };
};

export const getPendingInstructors = async () => {
  const results = await db
    .select({
      id: instructorProfilesTable.id,
      userId: instructorProfilesTable.userId,
      status: instructorProfilesTable.status,
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
      userAge: usersTable.age,
      userRole: usersTable.role,
      userCreatedAt: usersTable.createdAt,
    })
    .from(instructorProfilesTable)
    .innerJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
    .where(eq(instructorProfilesTable.status, "pending"))
    .orderBy(instructorProfilesTable.createdAt);

  return results;
};

export const getInstructorProfileDetail = async (profileId) => {
  const results = await db
    .select({
      id: instructorProfilesTable.id,
      userId: instructorProfilesTable.userId,
      status: instructorProfilesTable.status,
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
      userAge: usersTable.age,
      userRole: usersTable.role,
      userCreatedAt: usersTable.createdAt,
    })
    .from(instructorProfilesTable)
    .innerJoin(usersTable, eq(instructorProfilesTable.userId, usersTable.id))
    .where(eq(instructorProfilesTable.id, profileId))
    .limit(1);

  if (results.length === 0) throw new ApiError(404, "Instructor profile not found");

  const profile = results[0];

  const [enrollmentCount] = await db
    .select({ value: db.$count(courseTakenTable) })
    .from(courseTakenTable)
    .where(eq(courseTakenTable.userId, profile.userId));

  const [courseCount] = await db
    .select({ value: db.$count(coursesTable) })
    .from(coursesTable)
    .where(eq(coursesTable.instructorId, profileId));

  const userCourses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.instructorId, profileId));

  let totalRevenue = 0;
  for (const course of userCourses) {
    const [rev] = await db
      .select({ value: db.$count(courseTakenTable) })
      .from(courseTakenTable)
      .where(eq(courseTakenTable.courseId, course.id));
  }

  const [totalRevenueResult] = await db
    .select({ value: db.$count(courseTakenTable) })
    .from(courseTakenTable)
    .where(eq(courseTakenTable.userId, profile.userId));

  return {
    ...profile,
    enrolledCourses: totalRevenueResult?.value || 0,
    coursesCreated: courseCount?.value || 0,
    userCourses,
  };
};

export const getInstructorByUserId = async (userId) => {
  const profiles = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.userId, userId));

  if (profiles.length === 0) return null;
  return profiles[0];
};

export const getInstructorById = async (id) => {
  const profiles = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.id, id));

  if (profiles.length === 0) throw new ApiError(404, "Instructor not found");
  return profiles[0];
};

export const getInstructorWithUser = async (instructorId) => {
  const profile = await getInstructorById(instructorId);

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, profile.userId));

  if (users.length === 0) throw new ApiError(404, "User not found");

  return {
    ...profile,
    user: publicUser(users[0]),
  };
};

export const getAllInstructors = async () => {
  const profiles = await db.select().from(instructorProfilesTable);
  return profiles;
};

export const getInstructorCourses = async (instructorId) => {
  const courses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.instructorId, instructorId));
  return courses;
};

export const updateInstructorProfile = async (userId, data) => {
  const existing = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.userId, userId));

  if (existing.length === 0) {
    throw new ApiError(404, "Instructor profile not found");
  }

  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== "")
  );

  await db
    .update(instructorProfilesTable)
    .set(cleanData)
    .where(eq(instructorProfilesTable.userId, userId));

  const updated = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.userId, userId));

  return updated[0];
};

export const updateMyCourse = async (userId, courseId, data) => {
  const profiles = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.userId, userId))
    .limit(1);

  if (profiles.length === 0) throw new ApiError(404, "Instructor profile not found");

  const courseRows = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId))
    .limit(1);

  if (courseRows.length === 0) throw new ApiError(404, "Course not found");
  if (courseRows[0].instructorId !== profiles[0].id) {
    throw new ApiError(403, "You don't own this course");
  }

  const cleanData = Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (key === "topics" && Array.isArray(value)) return [key, value];
        if (key === "duration" || key === "price") return [key, String(value)];
        return [key, value];
      })
  );

  await db
    .update(coursesTable)
    .set({ ...cleanData, updatedAt: new Date() })
    .where(eq(coursesTable.id, courseId));

  const updated = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId));

  return updated[0];
};

const getProfileByUserId = async (userId) => {
  const profiles = await db
    .select()
    .from(instructorProfilesTable)
    .where(eq(instructorProfilesTable.userId, userId))
    .limit(1);

  if (profiles.length === 0) throw new ApiError(404, "Instructor profile not found");
  return profiles[0];
};

const assertCourseOwnership = async (profileId, courseId) => {
  const courseRows = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId))
    .limit(1);

  if (courseRows.length === 0) throw new ApiError(404, "Course not found");
  if (courseRows[0].instructorId !== profileId) {
    throw new ApiError(403, "You don't own this course");
  }
  return courseRows[0];
};

export const deleteMyCourse = async (userId, courseId) => {
  const profile = await getProfileByUserId(userId);
  await assertCourseOwnership(profile.id, courseId);

  await db.delete(chaptersTable).where(eq(chaptersTable.courseId, courseId));
  await db.delete(coursesTable).where(eq(coursesTable.id, courseId));
};

export const getInstructorDashboardStats = async (userId) => {
  const profile = await getProfileByUserId(userId);

  const [courseStats] = await db
    .select({
      totalCourses: sql`cast(count(${coursesTable.id}) as int)`,
    })
    .from(coursesTable)
    .where(eq(coursesTable.instructorId, profile.id));

  const courseIds = await db
    .select({ id: coursesTable.id })
    .from(coursesTable)
    .where(eq(coursesTable.instructorId, profile.id));

  if (courseIds.length === 0) {
    return {
      totalCourses: 0,
      totalStudents: 0,
      totalRevenue: 0,
      recentEnrollments: [],
    };
  }

  const ids = courseIds.map((c) => c.id);

  const [enrollmentStats] = await db
    .select({
      totalStudents: sql`cast(count(${courseTakenTable.id}) as int)`,
      totalRevenue: sql`coalesce(cast(sum(cast(${courseTakenTable.price} as numeric)) as numeric(10,2)), 0)`,
    })
    .from(courseTakenTable)
    .where(sql`${courseTakenTable.courseId} IN ${ids}`);

  const recentEnrollments = await db
    .select({
      id: courseTakenTable.id,
      price: courseTakenTable.price,
      createdAt: courseTakenTable.createdAt,
      courseName: coursesTable.name,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(courseTakenTable)
    .innerJoin(coursesTable, eq(courseTakenTable.courseId, coursesTable.id))
    .innerJoin(usersTable, eq(courseTakenTable.userId, usersTable.id))
    .where(sql`${coursesTable.instructorId} = ${profile.id}`)
    .orderBy(sql`${courseTakenTable.createdAt} DESC`)
    .limit(5);

  return {
    totalCourses: courseStats?.totalCourses || 0,
    totalStudents: enrollmentStats?.totalStudents || 0,
    totalRevenue: Number(enrollmentStats?.totalRevenue || 0),
    recentEnrollments,
  };
};

export const getMyCourseDiscounts = async (userId, courseId) => {
  const profile = await getProfileByUserId(userId);
  await assertCourseOwnership(profile.id, courseId);

  const discounts = await db
    .select()
    .from(discountTable)
    .where(eq(discountTable.courseId, courseId));

  return discounts;
};

export const createMyCourseDiscount = async (userId, courseId, data) => {
  const profile = await getProfileByUserId(userId);
  await assertCourseOwnership(profile.id, courseId);

  const existing = await db
    .select()
    .from(discountTable)
    .where(eq(discountTable.courseId, courseId));

  if (existing.length > 0) {
    throw new ApiError(409, "A discount already exists for this course. Update it instead.");
  }

  const [discount] = await db
    .insert(discountTable)
    .values({
      courseId,
      discount: String(data.discount),
      couponCode: data.couponCode || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      maxUses: data.maxUses || null,
      usedCount: 0,
    })
    .returning();

  return discount;
};

export const updateMyCourseDiscount = async (userId, courseId, discountId, data) => {
  const profile = await getProfileByUserId(userId);
  await assertCourseOwnership(profile.id, courseId);

  const existing = await db
    .select()
    .from(discountTable)
    .where(eq(discountTable.id, discountId))
    .limit(1);

  if (existing.length === 0) throw new ApiError(404, "Discount not found");
  if (existing[0].courseId !== courseId) {
    throw new ApiError(403, "This discount doesn't belong to this course");
  }

  const cleanData = Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (key === "discount") return [key, String(value)];
        if (key === "expiresAt") return [key, value ? new Date(value) : null];
        return [key, value];
      })
  );

  await db
    .update(discountTable)
    .set({ ...cleanData, updatedAt: new Date() })
    .where(eq(discountTable.id, discountId));

  const updated = await db
    .select()
    .from(discountTable)
    .where(eq(discountTable.id, discountId));

  return updated[0];
};

export const deleteMyCourseDiscount = async (userId, courseId, discountId) => {
  const profile = await getProfileByUserId(userId);
  await assertCourseOwnership(profile.id, courseId);

  const existing = await db
    .select()
    .from(discountTable)
    .where(eq(discountTable.id, discountId))
    .limit(1);

  if (existing.length === 0) throw new ApiError(404, "Discount not found");
  if (existing[0].courseId !== courseId) {
    throw new ApiError(403, "This discount doesn't belong to this course");
  }

  await db.delete(discountTable).where(eq(discountTable.id, discountId));
};
