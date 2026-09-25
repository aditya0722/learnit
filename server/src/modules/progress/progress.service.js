import { eq, and } from "drizzle-orm";
import { db } from "../../index.js";
import { chapterProgressTable } from "../../db/schemas/chapterProgress.js";
import { chaptersTable } from "../../db/schemas/chapters.js";
import { AssignmentTable } from "../../db/schemas/assignment.js";
import { AssignmentSubmissionsTable } from "../../db/schemas/submissions.js";
import { testStore, nextTestId } from "../../db/testStore.js";

export const getCourseProgress = async (userId, courseId) => {
  if (process.env.NODE_ENV === "test") {
    const chapters = testStore.chapters.filter((c) => c.courseId === Number(courseId));
    const progress = testStore.chapterProgress.filter(
      (p) => p.userId === userId && p.courseId === Number(courseId)
    );
    return chapters.map((ch) => {
      const p = progress.find((pr) => pr.chapterId === ch.id);
      return {
        chapterId: ch.id,
        chapterNumber: ch.chapterNumber,
        isCompleted: p?.isCompleted || false,
        completedAt: p?.completedAt || null,
        videoTimeWatched: p?.videoTimeWatched || 0,
        videoDuration: p?.videoDuration || 0,
        isVideoWatched: p?.isVideoWatched || false,
      };
    });
  }

  const chapters = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.courseId, Number(courseId)));

  const progress = await db
    .select()
    .from(chapterProgressTable)
    .where(
      and(
        eq(chapterProgressTable.userId, userId),
        eq(chapterProgressTable.courseId, Number(courseId))
      )
    );

  return chapters.map((ch) => {
    const p = progress.find((pr) => pr.chapterId === ch.id);
    return {
      chapterId: ch.id,
      chapterNumber: ch.chapterNumber,
      isCompleted: p?.isCompleted || false,
      completedAt: p?.completedAt || null,
      videoTimeWatched: p?.videoTimeWatched || 0,
      videoDuration: p?.videoDuration || 0,
      isVideoWatched: p?.isVideoWatched || false,
    };
  });
};

export const isChapterUnlocked = async (userId, courseId, chapterId) => {
  if (process.env.NODE_ENV === "test") {
    const chapters = testStore.chapters
      .filter((c) => c.courseId === Number(courseId))
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
    const target = chapters.find((c) => c.id === Number(chapterId));
    if (!target) return false;
    if (target.chapterNumber <= 1) return true;

    const prevChapters = chapters.filter((c) => c.chapterNumber < target.chapterNumber);
    for (const prev of prevChapters) {
      const prevProgress = testStore.chapterProgress.find(
        (p) => p.userId === userId && p.chapterId === prev.id
      );
      if (!prevProgress?.isCompleted) return false;
    }
    return true;
  }

  const allChapters = await db
    .select()
    .from(chaptersTable)
    .where(eq(chaptersTable.courseId, Number(courseId)))
    .orderBy(chaptersTable.chapterNumber);

  const target = allChapters.find((ch) => ch.id === Number(chapterId));
  if (!target) return false;
  if (target.chapterNumber <= 1) return true;

  const prevChapters = allChapters.filter((ch) => ch.chapterNumber < target.chapterNumber);

  for (const prev of prevChapters) {
    const prevProgress = await db
      .select()
      .from(chapterProgressTable)
      .where(
        and(
          eq(chapterProgressTable.userId, userId),
          eq(chapterProgressTable.chapterId, prev.id)
        )
      );

    if (!prevProgress[0]?.isCompleted) return false;
  }

  return true;
};

export const checkAndCompleteChapter = async (userId, courseId, chapterId) => {
  if (process.env.NODE_ENV === "test") {
    const existing = testStore.chapterProgress.find(
      (p) => p.userId === userId && p.chapterId === Number(chapterId)
    );
    const videoWatched = existing?.isVideoWatched || false;

    const assignments = testStore.assignments.filter((a) => a.chapter === Number(chapterId));
    const allPassed = assignments.length === 0 || assignments.every((a) => {
      const sub = testStore.submissions.find(
        (s) => s.assignmentId === a.id && s.userId === userId && s.totalPoints > 0 && (s.score / s.totalPoints) >= 0.7
      );
      return !!sub;
    });

    if (videoWatched && allPassed) {
      if (existing) {
        existing.isCompleted = true;
        existing.completedAt = new Date().toISOString();
      } else {
        testStore.chapterProgress.push({
          id: nextTestId("chapterProgress"),
          userId,
          chapterId: Number(chapterId),
          courseId: Number(courseId),
          isCompleted: true,
          completedAt: new Date().toISOString(),
        });
      }
      return true;
    }
    return false;
  }

  const existing = await db
    .select()
    .from(chapterProgressTable)
    .where(
      and(
        eq(chapterProgressTable.userId, userId),
        eq(chapterProgressTable.chapterId, Number(chapterId))
      )
    );

  const videoWatched = existing[0]?.isVideoWatched || false;

  const assignments = await db
    .select()
    .from(AssignmentTable)
    .where(eq(AssignmentTable.chapter, Number(chapterId)));

  let allPassed = assignments.length === 0;
  if (assignments.length > 0) {
    allPassed = true;
    for (const assignment of assignments) {
      const submissions = await db
        .select()
        .from(AssignmentSubmissionsTable)
        .where(
          and(
            eq(AssignmentSubmissionsTable.assignmentId, assignment.id),
            eq(AssignmentSubmissionsTable.userId, userId)
          )
        );

      const passed = submissions.some(
        (s) => s.totalPoints > 0 && s.score / s.totalPoints >= 0.7
      );

      if (!passed) {
        allPassed = false;
        break;
      }
    }
  }

  if (videoWatched && allPassed) {
    if (existing.length > 0) {
      await db
        .update(chapterProgressTable)
        .set({ isCompleted: true, completedAt: new Date() })
        .where(eq(chapterProgressTable.id, existing[0].id));
    } else {
      await db.insert(chapterProgressTable).values({
        userId,
        chapterId: Number(chapterId),
        courseId: Number(courseId),
        isCompleted: true,
        completedAt: new Date(),
      });
    }
    return true;
  }

  return false;
};

export const updateVideoProgress = async (userId, courseId, chapterId, timeWatched, duration) => {
  const isVideoWatched = duration > 0 && timeWatched >= duration * 0.8;

  if (process.env.NODE_ENV === "test") {
    const existing = testStore.chapterProgress.find(
      (p) => p.userId === userId && p.chapterId === Number(chapterId)
    );
    if (existing) {
      existing.videoTimeWatched = Math.max(existing.videoTimeWatched || 0, timeWatched);
      existing.videoDuration = duration;
      existing.isVideoWatched = existing.isVideoWatched || isVideoWatched;
    } else {
      testStore.chapterProgress.push({
        id: nextTestId("chapterProgress"),
        userId,
        chapterId: Number(chapterId),
        courseId: Number(courseId),
        isCompleted: false,
        completedAt: null,
        videoTimeWatched: timeWatched,
        videoDuration: duration,
        isVideoWatched,
      });
    }
    return { timeWatched, duration, isVideoWatched };
  }

  const existing = await db
    .select()
    .from(chapterProgressTable)
    .where(
      and(
        eq(chapterProgressTable.userId, userId),
        eq(chapterProgressTable.chapterId, Number(chapterId))
      )
    );

  if (existing.length > 0) {
    const currentMax = existing[0].videoTimeWatched || 0;
    await db
      .update(chapterProgressTable)
      .set({
        videoTimeWatched: Math.max(currentMax, timeWatched),
        videoDuration: duration,
        isVideoWatched: existing[0].isVideoWatched || isVideoWatched,
      })
      .where(eq(chapterProgressTable.id, existing[0].id));
  } else {
    await db.insert(chapterProgressTable).values({
      userId,
      chapterId: Number(chapterId),
      courseId: Number(courseId),
      isCompleted: false,
      videoTimeWatched: timeWatched,
      videoDuration: duration,
      isVideoWatched,
    });
  }

  return { timeWatched, duration, isVideoWatched };
};
