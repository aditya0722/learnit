import { db } from "../../index.js";
import { chaptersTable } from "../../db/schemas/chapters.js";
import { eq } from "drizzle-orm";
import { ApiError } from "../../utils/ApiError.js";
import { nextTestId, testStore } from "../../db/testStore.js";
import { generateSignedUrl } from "../../middleware/cloudinaryUpload.js";

function extractCloudinaryPublicId(urlOrId) {
  if (!urlOrId) return null;
  if (!urlOrId.startsWith("http")) return urlOrId;
  if (!urlOrId.includes("cloudinary")) return null;
  try {
    const parts = urlOrId.split("/upload/");
    if (parts.length < 2) return null;
    let id = parts[1];
    if (id.startsWith("v")) id = id.replace(/^v\d+\//, "");
    id = id.replace(/\.[^.]+$/, "");
    return id;
  } catch {
    return null;
  }
}

function enrichChapter(chapter) {
  if (!chapter) return chapter;
  const result = { ...chapter };
  const thumbId = extractCloudinaryPublicId(chapter.thumbnail);
  if (thumbId) {
    try {
      result.thumbnail = generateSignedUrl(thumbId, "image");
    } catch (_) {}
  }
  const videoId = extractCloudinaryPublicId(chapter.videoUrl);
  if (videoId) {
    try {
      result.videoUrl = generateSignedUrl(videoId, "video");
    } catch (_) {}
  }
  return result;
}

const getChapters = async (id) => {
  if (process.env.NODE_ENV === "test") {
    return testStore.chapters.filter((chapter) => chapter.courseId === Number(id));
  }

  const chapters = await db.select().from(chaptersTable).where(eq(chaptersTable.courseId, id));
  return chapters.map(enrichChapter);
}   

const addChapters = async ({ chapterName, courseId, chapterNumber, thumbnail, videoUrl }) => {
  if (process.env.NODE_ENV === "test") {
    const courseExists = testStore.courses.some((course) => course.id === Number(courseId));

    if (!courseExists) {
      throw new ApiError(404, "Course not found");
    }

    const chapter = {
      id: nextTestId("chapters"),
      chapterName,
      courseId: Number(courseId),
      chapterNumber: Number(chapterNumber),
      thumbnail,
      videoUrl,
    };
    testStore.chapters.push(chapter);
    return chapter;
  }

  await db.insert(chaptersTable).values({
    chapterName,
    courseId,
    chapterNumber,
    thumbnail,
    videoUrl,
  });
}

const updateChapters = async (id, data) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  if (process.env.NODE_ENV === "test") {
    const chapter = testStore.chapters.find((record) => record.id === Number(id));

    if (!chapter) {
      throw new ApiError(404, "Chapter not found");
    }

    Object.assign(chapter, cleanData);
    return chapter;
  }

  await db.update(chaptersTable).set(cleanData).where(eq(chaptersTable.id, id));
}

const deleteChapters = async (id) => {
  if (process.env.NODE_ENV === "test") {
    const index = testStore.chapters.findIndex((chapter) => chapter.id === Number(id));

    if (index === -1) {
      throw new ApiError(404, "Chapter not found");
    }

    testStore.chapters.splice(index, 1);
    return;
  }

  await db.delete(chaptersTable).where(eq(chaptersTable.id, id));
}

export { getChapters, addChapters, updateChapters, deleteChapters };
