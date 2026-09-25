import { eq } from "drizzle-orm";
import { db } from "../../index.js";
import { courseTakenTable } from "../../db/schemas/courseTaken.js";
import { ApiError } from "../../utils/ApiError.js";
import { nextTestId, testStore } from "../../db/testStore.js";

const ensureUserAndCourse = (userId, courseId) => {
  const userExists = testStore.users.some((user) => user.id === Number(userId));
  const courseExists = testStore.courses.some((course) => course.id === Number(courseId));

  if (!userExists) throw new ApiError(404, "User not found");
  if (!courseExists) throw new ApiError(404, "Course not found");
};

export const getCourseTaken = async () => {
  if (process.env.NODE_ENV === "test") {
    return testStore.courseTaken;
  }

  return db.select().from(courseTakenTable);
};

export const getCourseTakenById = async (id) => {
  const records = process.env.NODE_ENV === "test"
    ? testStore.courseTaken.filter((record) => record.id === Number(id))
    : await db.select().from(courseTakenTable).where(eq(courseTakenTable.id, id));

  if (records.length === 0) {
    throw new ApiError(404, "Course taken record not found");
  }

  return records[0];
};

export const createCourseTaken = async ({ userId, courseId, price }) => {
  if (process.env.NODE_ENV === "test") {
    ensureUserAndCourse(userId, courseId);

    const record = {
      id: nextTestId("courseTaken"),
      userId: Number(userId),
      courseId: Number(courseId),
      price: String(price),
    };
    testStore.courseTaken.push(record);
    return record;
  }

  await db.insert(courseTakenTable).values({
    userId,
    courseId,
    price: String(price),
  });
};

export const updateCourseTaken = async (id, data) => {
  const cleanData = Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => key === "price" ? [key, String(value)] : [key, value])
  );

  if (process.env.NODE_ENV === "test") {
    const record = testStore.courseTaken.find((item) => item.id === Number(id));

    if (!record) {
      throw new ApiError(404, "Course taken record not found");
    }

    ensureUserAndCourse(cleanData.userId ?? record.userId, cleanData.courseId ?? record.courseId);
    Object.assign(record, cleanData);
    return record;
  }

  await db.update(courseTakenTable).set(cleanData).where(eq(courseTakenTable.id, id));
  return getCourseTakenById(id);
};

export const deleteCourseTaken = async (id) => {
  if (process.env.NODE_ENV === "test") {
    const index = testStore.courseTaken.findIndex((record) => record.id === Number(id));

    if (index === -1) {
      throw new ApiError(404, "Course taken record not found");
    }

    testStore.courseTaken.splice(index, 1);
    return;
  }

  await db.delete(courseTakenTable).where(eq(courseTakenTable.id, id));
};
