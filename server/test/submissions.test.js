import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgres://test:test@localhost:5432/learnit_test";
const { testStore, resetTestStore } = await import("../src/db/testStore.js");
const { submitAssignment, getSubmissionsByAssignment, getSubmissionDetail } = await import("../src/modules/submissions/submissions.service.js");

beforeEach(() => {
  resetTestStore();
  testStore.assignments.push({ id: 1, chapter: 1, title: "Intro quiz" });
  testStore.assignmentQuestions.push(
    { id: 1, assignmentId: 1, questionText: "Choose the answer", questionType: "mcq", options: ["One", "Two"], correctOptionIndex: 1, points: 2 },
    { id: 2, assignmentId: 1, questionText: "Is this true?", questionType: "true_false", options: [], correctAnswer: "true", points: 3 },
  );
});

test("a submission contains saved answers, question context, and marks on immediate and later review", async () => {
  const result = await submitAssignment(1, 10, [{ questionId: 1, answer: "1" }, { questionId: 2, answer: "false" }]);
  assert.equal(result.submission.score, 2);
  assert.equal(result.submission.totalPoints, 5);
  assert.ok(result.answers.every((answer) => answer.id && answer.question?.questionText));
  assert.equal(result.answers[0].question.correctOptionIndex, 1);
  assert.deepEqual(await getSubmissionDetail(result.submission.id, 10), result);
});

test("redo creates a new attempt and keeps the previous answers and marks", async () => {
  const first = await submitAssignment(1, 10, [{ questionId: 1, answer: "0" }]);
  const second = await submitAssignment(1, 10, [{ questionId: 1, answer: "1" }, { questionId: 2, answer: "true" }]);
  assert.notEqual(first.submission.id, second.submission.id);
  assert.equal(second.submission.score, 5);
  assert.deepEqual((await getSubmissionsByAssignment(1, 10)).map((attempt) => attempt.id), [second.submission.id, first.submission.id]);
  assert.deepEqual(await getSubmissionDetail(first.submission.id, 10), first);
});

test("skipped questions remain in total marks and are saved as unanswered", async () => {
  const result = await submitAssignment(1, 10, [{ questionId: 1, answer: "1" }]);
  assert.equal(result.submission.score, 2);
  assert.equal(result.submission.totalPoints, 5);
  assert.equal(result.answers.length, 2);
  assert.equal(result.answers[1].answer, "");
  assert.equal(result.answers[1].pointsEarned, 0);
});

test("students cannot list or review another student's attempts", async () => {
  const result = await submitAssignment(1, 10, [{ questionId: 1, answer: "1" }]);
  assert.deepEqual(await getSubmissionsByAssignment(1, 20), []);
  await assert.rejects(getSubmissionDetail(result.submission.id, 20), (error) => error.statusCode === 404);
});

test("duplicate or unrelated question IDs cannot inflate marks or create an attempt", async () => {
  await assert.rejects(submitAssignment(1, 10, [{ questionId: 1, answer: "1" }, { questionId: 1, answer: "1" }]), (error) => error.statusCode === 400);
  await assert.rejects(submitAssignment(1, 10, [{ questionId: 99, answer: "1" }]), (error) => error.statusCode === 400);
  assert.equal(testStore.submissions.length, 0);
});
