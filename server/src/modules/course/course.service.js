import { db } from "../../index.js";
import { coursesTable } from "../../db/schemas/courses.js";
import { ApiError } from "../../utils/ApiError.js";
import {courseTakenTable} from "../../db/schemas/courseTaken.js"
import { eq } from "drizzle-orm";
import { nextTestId, testStore } from "../../db/testStore.js";

export const select=async()=>{
        if (process.env.NODE_ENV === "test") {
                return testStore.courses;
        }

        const courses= await db.select().from(coursesTable);
        return courses;
}

export const selectById=async(id)=>{
        if (process.env.NODE_ENV === "test") {
                return testStore.courses.find((course) => course.id === Number(id)) || null;
        }

        const [course]= await db.select().from(coursesTable).where(eq(coursesTable.id,id));
        return course || null;
}

export const insert= async({ name, topics, duration, price, thumbnail, instructorId })=>{
        if (process.env.NODE_ENV === "test") {
                const course = {
                        id: nextTestId("courses"),
                        name,
                        topics,
                        duration: String(duration),
                        price: String(price),
                        thumbnail,
                        instructorId: instructorId || null,
                };
                testStore.courses.push(course);
                return course;
        }

        await db.insert(coursesTable).values({
            name,
            topics,
            duration: String(duration),
            price: String(price),
            thumbnail,
            instructorId: instructorId || null,
        })
}
export const remove=async(id)=>{
    if (process.env.NODE_ENV === "test") {
        const index = testStore.courses.findIndex((course) => course.id === Number(id));

        if (index === -1) {
            throw new ApiError(404, "Course not found");
        }

        testStore.courses.splice(index, 1);
        testStore.chapters = testStore.chapters.filter((chapter) => chapter.courseId !== Number(id));
        return;
    }

    await db.delete(coursesTable).where(eq(coursesTable.id,id));
}

export const update = async (id, data) => {
    const cleanData = Object.fromEntries(
        Object.entries(data)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => (
                key === "duration" || key === "price" ? [key, String(value)] : [key, value]
            ))
    );

    if (process.env.NODE_ENV === "test") {
        const course = testStore.courses.find((record) => record.id === Number(id));

        if (!course) {
            throw new ApiError(404, "Course not found");
        }

        Object.assign(course, cleanData);
        return course;
    }

    await db
        .update(coursesTable)
        .set(cleanData)
        .where(eq(coursesTable.id, id));
};




export const buy=async(userId,courseId,price)=>{
     if (process.env.NODE_ENV === "test") {
          const userExists = testStore.users.some((user) => user.id === Number(userId));
          const courseExists = testStore.courses.some((course) => course.id === Number(courseId));

          if (!userExists) throw new ApiError(404, "User not found");
          if (!courseExists) throw new ApiError(404, "Course not found");

          const purchase = {
            id: nextTestId("courseTaken"),
            userId: Number(userId),
            courseId: Number(courseId),
            price: String(price),
          };
          testStore.courseTaken.push(purchase);
          return purchase;
     }

     await db.insert(courseTakenTable).values({
          userId,
          courseId,
          price: String(price)
        })
}

