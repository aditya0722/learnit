import { eq } from "drizzle-orm";
import { db } from "../../index.js";
import { AssignmentTable, AssignmentQuestionsTable } from "../../db/schemas/assignment.js";
import { ApiError } from "../../utils/ApiError.js";
import { nextTestId, testStore } from "../../db/testStore.js";

const ensureChapter = (chapterId) => {
  const chapterExists = testStore.chapters.some((chapter) => chapter.id === Number(chapterId));
  if (!chapterExists) {
    throw new ApiError(404, "Chapter not found");
  }
};

const toApiAssignment = (record, questions = []) => ({
  id: record.id,
  title: record.title,
  description: record.description,
  chapter: record.chapter,
  questions: questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    questionType: q.questionType || "mcq",
    correctAnswer: q.correctAnswer,
    codeLanguage: q.codeLanguage,
    testCases: q.testCases,
    points: q.points || 1,
    explanation: q.explanation,
  })),
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export const getAssignments = async () => {
  if (process.env.NODE_ENV === "test") {
    return testStore.assignments.map((a) => toApiAssignment(a, testStore.assignmentQuestions.filter((q) => q.assignmentId === a.id)));
  }

  const assignments = await db.select().from(AssignmentTable);
  const allQuestions = await db.select().from(AssignmentQuestionsTable);
  return assignments.map((a) => toApiAssignment(a, allQuestions.filter((q) => q.assignmentId === a.id)));
};

export const getAssignmentsByChapter = async (chapterId) => {
  if (process.env.NODE_ENV === "test") {
    const assignments = testStore.assignments.filter((a) => a.chapter === Number(chapterId));
    return assignments.map((a) => toApiAssignment(a, testStore.assignmentQuestions.filter((q) => q.assignmentId === a.id)));
  }

  const assignments = await db.select().from(AssignmentTable).where(eq(AssignmentTable.chapter, chapterId));
  const assignmentIds = assignments.map((a) => a.id);
  const questions = assignmentIds.length > 0
    ? await db.select().from(AssignmentQuestionsTable)
    : [];
  return assignments.map((a) => toApiAssignment(a, questions.filter((q) => q.assignmentId === a.id)));
};

export const getAssignmentById = async (id) => {
  let assignment;
  let questions;

  if (process.env.NODE_ENV === "test") {
    assignment = testStore.assignments.find((a) => a.id === Number(id));
    questions = assignment ? testStore.assignmentQuestions.filter((q) => q.assignmentId === assignment.id) : [];
  } else {
    const rows = await db.select().from(AssignmentTable).where(eq(AssignmentTable.id, id));
    assignment = rows[0];
    questions = assignment ? await db.select().from(AssignmentQuestionsTable).where(eq(AssignmentQuestionsTable.assignmentId, id)) : [];
  }

  if (!assignment) {
    throw new ApiError(404, "Assignment not found");
  }

  return toApiAssignment(assignment, questions);
};

export const createAssignment = async ({ chapter, title, description, questions }) => {
  if (process.env.NODE_ENV === "test") {
    ensureChapter(chapter);

    const assignment = {
      id: nextTestId("assignments"),
      chapter: Number(chapter),
      title,
      description: description || null,
    };
    testStore.assignments.push(assignment);

    if (questions && questions.length > 0) {
      for (const q of questions) {
        const questionRecord = {
          id: nextTestId("assignmentQuestions"),
          assignmentId: assignment.id,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          questionType: q.questionType || "mcq",
          correctAnswer: q.correctAnswer || null,
          codeLanguage: q.codeLanguage || null,
          testCases: q.testCases || null,
          points: q.points || 1,
          explanation: q.explanation || null,
        };
        testStore.assignmentQuestions.push(questionRecord);
      }
    }

    return toApiAssignment(assignment, testStore.assignmentQuestions.filter((q) => q.assignmentId === assignment.id));
  }

  const [inserted] = await db.insert(AssignmentTable).values({
    chapter,
    title,
    description: description || null,
  }).returning();

  if (questions && questions.length > 0) {
    const questionValues = questions.map((q) => ({
      assignmentId: inserted.id,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      questionType: q.questionType || "mcq",
      correctAnswer: q.correctAnswer || null,
      codeLanguage: q.codeLanguage || null,
      testCases: q.testCases || null,
      points: q.points || 1,
      explanation: q.explanation || null,
    }));
    await db.insert(AssignmentQuestionsTable).values(questionValues);
  }

  return getAssignmentById(inserted.id);
};

export const updateAssignment = async (id, data) => {
  const { questions, ...rest } = data;
  const cleanData = Object.fromEntries(
    Object.entries(rest).filter(([, value]) => value !== undefined)
  );

  if (process.env.NODE_ENV === "test") {
    const assignment = testStore.assignments.find((a) => a.id === Number(id));
    if (!assignment) throw new ApiError(404, "Assignment not found");

    Object.assign(assignment, cleanData);

    if (questions !== undefined) {
      testStore.assignmentQuestions = testStore.assignmentQuestions.filter((q) => q.assignmentId !== assignment.id);
      for (const q of questions) {
        testStore.assignmentQuestions.push({
          id: q.id || nextTestId("assignmentQuestions"),
          assignmentId: assignment.id,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          questionType: q.questionType || "mcq",
          correctAnswer: q.correctAnswer || null,
          codeLanguage: q.codeLanguage || null,
          testCases: q.testCases || null,
          points: q.points || 1,
          explanation: q.explanation || null,
        });
      }
    }

    return toApiAssignment(assignment, testStore.assignmentQuestions.filter((q) => q.assignmentId === assignment.id));
  }

  if (Object.keys(cleanData).length > 0) {
    await db.update(AssignmentTable).set(cleanData).where(eq(AssignmentTable.id, id));
  }

  if (questions !== undefined) {
    await db.delete(AssignmentQuestionsTable).where(eq(AssignmentQuestionsTable.assignmentId, id));
    if (questions.length > 0) {
      const questionValues = questions.map((q) => ({
        assignmentId: id,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        questionType: q.questionType || "mcq",
        correctAnswer: q.correctAnswer || null,
        codeLanguage: q.codeLanguage || null,
        testCases: q.testCases || null,
        points: q.points || 1,
        explanation: q.explanation || null,
      }));
      await db.insert(AssignmentQuestionsTable).values(questionValues);
    }
  }

  return getAssignmentById(id);
};

export const deleteAssignment = async (id) => {
  if (process.env.NODE_ENV === "test") {
    const index = testStore.assignments.findIndex((a) => a.id === Number(id));
    if (index === -1) throw new ApiError(404, "Assignment not found");
    testStore.assignmentQuestions = testStore.assignmentQuestions.filter((q) => q.assignmentId !== Number(id));
    testStore.assignments.splice(index, 1);
    return;
  }

  await db.delete(AssignmentQuestionsTable).where(eq(AssignmentQuestionsTable.assignmentId, id));
  await db.delete(AssignmentTable).where(eq(AssignmentTable.id, id));
};
