import { eq, and } from "drizzle-orm";
import { db } from "../../index.js";
import { AssignmentTable, AssignmentQuestionsTable } from "../../db/schemas/assignment.js";
import { AssignmentSubmissionsTable, SubmissionAnswersTable } from "../../db/schemas/submissions.js";
import { chaptersTable } from "../../db/schemas/chapters.js";
import { ApiError } from "../../utils/ApiError.js";
import { nextTestId, testStore } from "../../db/testStore.js";
import { executeCode } from "../../services/codeRunner.js";
import { checkAndCompleteChapter } from "../progress/progress.service.js";

function gradeAnswer(question, answer) {
  const type = question.questionType || "mcq";

  switch (type) {
    case "mcq": {
      const correct = String(question.correctOptionIndex);
      return { isCorrect: answer === correct, pointsEarned: answer === correct ? question.points : 0 };
    }
    case "true_false": {
      const expected = (question.correctAnswer || "").toLowerCase().trim();
      const actual = answer.toLowerCase().trim();
      const isCorrect = actual === expected;
      return { isCorrect, pointsEarned: isCorrect ? question.points : 0 };
    }
    case "text_answer": {
      const expected = (question.correctAnswer || "").toLowerCase().trim();
      const actual = answer.toLowerCase().trim();
      const isCorrect = actual === expected;
      return { isCorrect, pointsEarned: isCorrect ? question.points : 0 };
    }
    default:
      return { isCorrect: false, pointsEarned: 0 };
  }
}

export const submitAssignment = async (assignmentId, userId, answers) => {
  const assignmentRows = await db.select().from(AssignmentTable).where(eq(AssignmentTable.id, assignmentId));
  if (assignmentRows.length === 0) throw new ApiError(404, "Assignment not found");

  const questions = await db.select().from(AssignmentQuestionsTable).where(eq(AssignmentQuestionsTable.assignmentId, assignmentId));
  if (questions.length === 0) throw new ApiError(400, "Assignment has no questions");

  const questionMap = {};
  for (const q of questions) {
    questionMap[q.id] = q;
  }

  let totalPoints = 0;
  let score = 0;
  const answerResults = [];

  for (const ans of answers) {
    const question = questionMap[ans.questionId];
    if (!question) continue;

    totalPoints += question.points;

    if (question.questionType === "code") {
      try {
        const results = await executeCode(ans.answer, question.codeLanguage, question.testCases || []);
        const allPassed = results.every((r) => r.isCorrect);
        const pointsEarned = allPassed ? question.points : 0;
        score += pointsEarned;

        answerResults.push({
          questionId: question.id,
          answer: ans.answer,
          isCorrect: allPassed ? 1 : 0,
          pointsEarned,
          output: JSON.stringify(results),
          error: null,
        });
      } catch (error) {
        answerResults.push({
          questionId: question.id,
          answer: ans.answer,
          isCorrect: 0,
          pointsEarned: 0,
          output: null,
          error: error.message,
        });
      }
    } else {
      const { isCorrect, pointsEarned } = gradeAnswer(question, ans.answer);
      score += pointsEarned;

      answerResults.push({
        questionId: question.id,
        answer: ans.answer,
        isCorrect: isCorrect ? 1 : 0,
        pointsEarned,
        output: null,
        error: null,
      });
    }
  }

  if (process.env.NODE_ENV === "test") {
    const submission = {
      id: nextTestId("submissions"),
      assignmentId: Number(assignmentId),
      userId,
      score,
      totalPoints,
      submittedAt: new Date().toISOString(),
    };
    testStore.submissions.push(submission);

    for (const ans of answerResults) {
      testStore.submissionAnswers.push({
        id: nextTestId("submissionAnswers"),
        submissionId: submission.id,
        ...ans,
      });
    }

    return { submission, answers: answerResults };
  }

  const [inserted] = await db.insert(AssignmentSubmissionsTable).values({
    assignmentId: Number(assignmentId),
    userId,
    score,
    totalPoints,
  }).returning();

  for (const ans of answerResults) {
    await db.insert(SubmissionAnswersTable).values({
      submissionId: inserted.id,
      ...ans,
    });
  }

  const chapterId = assignmentRows[0].chapter;
  let chapterCompleted = null;
  try {
    const chapterRows = await db.select().from(chaptersTable).where(eq(chaptersTable.id, chapterId));
    const courseId = chapterRows[0]?.courseId || null;
    chapterCompleted = await checkAndCompleteChapter(userId, courseId, chapterId);
  } catch (_) {}

  return { submission: inserted, answers: answerResults, chapterCompleted };
};

export const getSubmissionsByAssignment = async (assignmentId, userId) => {
  if (process.env.NODE_ENV === "test") {
    return testStore.submissions
      .filter((s) => s.assignmentId === Number(assignmentId) && s.userId === userId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  return db
    .select()
    .from(AssignmentSubmissionsTable)
    .where(
      and(
        eq(AssignmentSubmissionsTable.assignmentId, assignmentId),
        eq(AssignmentSubmissionsTable.userId, userId)
      )
    );
};

export const getSubmissionDetail = async (submissionId, userId) => {
  let submission;
  let answers;

  if (process.env.NODE_ENV === "test") {
    submission = testStore.submissions.find(
      (s) => s.id === Number(submissionId) && s.userId === userId
    );
    answers = submission
      ? testStore.submissionAnswers.filter((a) => a.submissionId === submission.id)
      : [];
  } else {
    const rows = await db
      .select()
      .from(AssignmentSubmissionsTable)
      .where(
        and(
          eq(AssignmentSubmissionsTable.id, submissionId),
          eq(AssignmentSubmissionsTable.userId, userId)
        )
      );
    submission = rows[0];

    answers = submission
      ? await db.select().from(SubmissionAnswersTable).where(eq(SubmissionAnswersTable.submissionId, submission.id))
      : [];
  }

  if (!submission) throw new ApiError(404, "Submission not found");

  const questions = await db
    .select()
    .from(AssignmentQuestionsTable)
    .where(eq(AssignmentQuestionsTable.assignmentId, submission.assignmentId));

  const questionMap = {};
  for (const q of questions) {
    questionMap[q.id] = q;
  }

  const enrichedAnswers = answers.map((a) => {
    const q = questionMap[a.questionId];
    return {
      ...a,
      question: q
        ? {
            questionText: q.questionText,
            questionType: q.questionType || "mcq",
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points,
            testCases: q.testCases,
            codeLanguage: q.codeLanguage,
          }
        : null,
    };
  });

  return { submission, answers: enrichedAnswers };
};
