const initialState = () => ({
  users: [],
  courses: [],
  chapters: [],
  courseTaken: [],
  discounts: [],
  assignments: [],
  assignmentQuestions: [],
  submissions: [],
  submissionAnswers: [],
  refreshTokens: [],
  passwordResetTokens: [],
  chapterProgress: [],
  counters: {
    users: 1,
    courses: 1,
    chapters: 1,
    courseTaken: 1,
    discounts: 1,
    assignments: 1,
    assignmentQuestions: 1,
    submissions: 1,
    submissionAnswers: 1,
    refreshTokens: 1,
    passwordResetTokens: 1,
    chapterProgress: 1,
  },
});

export const testStore = initialState();

export const resetTestStore = () => {
  const fresh = initialState();
  Object.assign(testStore, fresh);
};

export const nextTestId = (tableName) => testStore.counters[tableName]++;
