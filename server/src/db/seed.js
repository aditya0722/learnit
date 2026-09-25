import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { coursesTable } from "./schemas/courses.js";
import { usersTable } from "./schemas/users.js";
import { chaptersTable } from "./schemas/chapters.js";
import { courseTakenTable } from "./schemas/courseTaken.js";
import { discountTable } from "./schemas/discounts.js";
import { AssignmentTable, AssignmentQuestionsTable } from "./schemas/assignment.js";
import { instructorProfilesTable } from "./schemas/instructorProfiles.js";
import bcrypt from "bcrypt";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("Seeding database...");

  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("password123", 10);
  const instructorHash = await bcrypt.hash("instructor123", 10);

  const users = await db
    .insert(usersTable)
    .values([
      { name: "Admin User", age: 30, email: "admin@learnit.com", password: adminHash, role: "admin" },
      { name: "Alice Johnson", age: 25, email: "alice@example.com", password: userHash },
      { name: "Bob Smith", age: 30, email: "bob@example.com", password: userHash },
      { name: "Charlie Brown", age: 22, email: "charlie@example.com", password: userHash },
      { name: "Diana Prince", age: 28, email: "diana@example.com", password: instructorHash, role: "instructor" },
      { name: "Eve Adams", age: 35, email: "eve@example.com", password: instructorHash, role: "instructor" },
    ])
    .returning();

  console.log(`Inserted ${users.length} users`);

  const instructors = await db
    .insert(instructorProfilesTable)
    .values([
      {
        userId: users[4].id,
        status: "approved",
        bio: "Full-stack developer with 8+ years of experience",
        headline: "Senior Software Engineer",
        expertise: "JavaScript, React, Node.js",
        experienceYears: 8,
      },
      {
        userId: users[5].id,
        status: "approved",
        bio: "Data scientist and Python enthusiast",
        headline: "Data Science Lead",
        expertise: "Python, Machine Learning, Data Analysis",
        experienceYears: 6,
      },
    ])
    .returning();

  console.log(`Inserted ${instructors.length} instructor profiles`);

  const courses = await db
    .insert(coursesTable)
    .values([
      {
        name: "JavaScript Fundamentals",
        topics: ["variables", "functions", "arrays", "objects", "async/await"],
        duration: 40,
        price: 49.99,
        thumbnail: "https://example.com/thumbnails/js.jpg",
        instructorId: instructors[0].id,
      },
      {
        name: "React Masterclass",
        topics: ["components", "hooks", "state management", "routing", "testing"],
        duration: 60,
        price: 79.99,
        thumbnail: "https://example.com/thumbnails/react.jpg",
        instructorId: instructors[0].id,
      },
      {
        name: "Node.js Backend Development",
        topics: ["express", "REST APIs", "authentication", "databases", "deployment"],
        duration: 50,
        price: 69.99,
        thumbnail: "https://example.com/thumbnails/node.jpg",
        instructorId: instructors[0].id,
      },
      {
        name: "Python for Data Science",
        topics: ["pandas", "numpy", "matplotlib", "machine learning", "statistics"],
        duration: 70,
        price: 89.99,
        thumbnail: "https://example.com/thumbnails/python.jpg",
        instructorId: instructors[1].id,
      },
      {
        name: "TypeScript Essentials",
        topics: ["types", "interfaces", "generics", "decorators", "modules"],
        duration: 35,
        price: 39.99,
        thumbnail: "https://example.com/thumbnails/ts.jpg",
        instructorId: instructors[0].id,
      },
    ])
    .returning();

  console.log(`Inserted ${courses.length} courses`);

  const chapters = await db
    .insert(chaptersTable)
    .values([
      { chapterName: "Introduction to JavaScript", courseId: courses[0].id, chapterNumber: 1, thumbnail: "https://example.com/chapters/js-intro.jpg", videoUrl: "https://example.com/videos/js-intro.mp4" },
      { chapterName: "Variables and Data Types", courseId: courses[0].id, chapterNumber: 2, thumbnail: "https://example.com/chapters/js-vars.jpg", videoUrl: "https://example.com/videos/js-vars.mp4" },
      { chapterName: "Functions and Scope", courseId: courses[0].id, chapterNumber: 3, thumbnail: "https://example.com/chapters/js-functions.jpg", videoUrl: "https://example.com/videos/js-functions.mp4" },
      { chapterName: "React Components", courseId: courses[1].id, chapterNumber: 1, thumbnail: "https://example.com/chapters/react-components.jpg", videoUrl: "https://example.com/videos/react-components.mp4" },
      { chapterName: "React Hooks", courseId: courses[1].id, chapterNumber: 2, thumbnail: "https://example.com/chapters/react-hooks.jpg", videoUrl: "https://example.com/videos/react-hooks.mp4" },
      { chapterName: "State Management with Redux", courseId: courses[1].id, chapterNumber: 3, thumbnail: "https://example.com/chapters/react-redux.jpg", videoUrl: "https://example.com/videos/react-redux.mp4" },
      { chapterName: "Express.js Basics", courseId: courses[2].id, chapterNumber: 1, thumbnail: "https://example.com/chapters/node-express.jpg", videoUrl: "https://example.com/videos/node-express.mp4" },
      { chapterName: "REST API Design", courseId: courses[2].id, chapterNumber: 2, thumbnail: "https://example.com/chapters/node-api.jpg", videoUrl: "https://example.com/videos/node-api.mp4" },
      { chapterName: "Introduction to Pandas", courseId: courses[3].id, chapterNumber: 1, thumbnail: "https://example.com/chapters/py-pandas.jpg", videoUrl: "https://example.com/videos/py-pandas.mp4" },
      { chapterName: "NumPy Fundamentals", courseId: courses[3].id, chapterNumber: 2, thumbnail: "https://example.com/chapters/py-numpy.jpg", videoUrl: "https://example.com/videos/py-numpy.mp4" },
      { chapterName: "TypeScript Basics", courseId: courses[4].id, chapterNumber: 1, thumbnail: "https://example.com/chapters/ts-intro.jpg", videoUrl: "https://example.com/videos/ts-intro.mp4" },
      { chapterName: "Interfaces and Types", courseId: courses[4].id, chapterNumber: 2, thumbnail: "https://example.com/chapters/ts-types.jpg", videoUrl: "https://example.com/videos/ts-types.mp4" },
    ])
    .returning();

  console.log(`Inserted ${chapters.length} chapters`);

  const assignments = await db
    .insert(AssignmentTable)
    .values([
      { title: "JS Intro Quiz", description: "Test your knowledge of JavaScript basics", chapter: chapters[0].id },
      { title: "Variables Quiz", description: "Test your understanding of variables and data types", chapter: chapters[1].id },
      { title: "Functions Quiz", description: "Test your knowledge of functions and scope", chapter: chapters[2].id },
      { title: "React Components Quiz", description: "Test your understanding of React components", chapter: chapters[3].id },
      { title: "React Hooks Quiz", description: "Test your knowledge of React hooks", chapter: chapters[4].id },
      { title: "Redux Quiz", description: "Test your understanding of state management", chapter: chapters[5].id },
      { title: "Express Quiz", description: "Test your knowledge of Express.js", chapter: chapters[6].id },
      { title: "REST API Quiz", description: "Test your understanding of REST API design", chapter: chapters[7].id },
      { title: "Pandas Quiz", description: "Test your knowledge of Pandas", chapter: chapters[8].id },
      { title: "NumPy Quiz", description: "Test your understanding of NumPy", chapter: chapters[9].id },
      { title: "TypeScript Basics Quiz", description: "Test your knowledge of TypeScript basics", chapter: chapters[10].id },
      { title: "Types and Interfaces Quiz", description: "Test your understanding of TypeScript types", chapter: chapters[11].id },
    ])
    .returning();

  console.log(`Inserted ${assignments.length} assignments`);

  const questions = await db
    .insert(AssignmentQuestionsTable)
    .values([
      { assignmentId: assignments[0].id, questionText: "Which keyword is used to declare a constant in JavaScript?", options: ["var", "let", "const", "static"], correctOptionIndex: 2 },
      { assignmentId: assignments[0].id, questionText: "What is the output of typeof null?", options: ["null", "undefined", "object", "boolean"], correctOptionIndex: 2 },
      { assignmentId: assignments[1].id, questionText: "Which of these is a primitive type?", options: ["Array", "Object", "String", "Function"], correctOptionIndex: 2 },
      { assignmentId: assignments[3].id, questionText: "What hook is used for side effects in React?", options: ["useState", "useEffect", "useContext", "useReducer"], correctOptionIndex: 1 },
      { assignmentId: assignments[4].id, questionText: "What does useState return?", options: ["A value", "An array", "A state and setter function", "An object"], correctOptionIndex: 2 },
    ])
    .returning();

  console.log(`Inserted ${questions.length} assignment questions`);

  const courseTaken = await db
    .insert(courseTakenTable)
    .values([
      { price: 49.99, courseId: courses[0].id, userId: users[1].id },
      { price: 79.99, courseId: courses[1].id, userId: users[1].id },
      { price: 69.99, courseId: courses[2].id, userId: users[2].id },
      { price: 89.99, courseId: courses[3].id, userId: users[3].id },
      { price: 39.99, courseId: courses[4].id, userId: users[3].id },
      { price: 49.99, courseId: courses[0].id, userId: users[2].id },
      { price: 79.99, courseId: courses[1].id, userId: users[3].id },
    ])
    .returning();

  console.log(`Inserted ${courseTaken.length} course-taken records`);

  const discounts = await db
    .insert(discountTable)
    .values([
      { discount: 10, couponCode: "JS10", courseId: courses[0].id, expiresAt: new Date("2026-12-31"), maxUses: 100 },
      { discount: 15, couponCode: "REACT15", courseId: courses[1].id, expiresAt: new Date("2026-12-31"), maxUses: 50 },
      { discount: 20, couponCode: "PYTHON20", courseId: courses[3].id, expiresAt: new Date("2026-12-31"), maxUses: 75 },
    ])
    .returning();

  console.log(`Inserted ${discounts.length} discounts`);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
