import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

process.env.NODE_ENV = "test";

const { default: app } = await import("../index.js");
const { resetTestStore } = await import("../src/db/testStore.js");

let server;
let baseUrl;

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const body = await response.json();
  return { response, body };
};

const postJson = (path, body) => request(path, {
  method: "POST",
  body: JSON.stringify(body),
});

const patchJson = (path, body) => request(path, {
  method: "PATCH",
  body: JSON.stringify(body),
});

const putJson = (path, body) => request(path, {
  method: "PUT",
  body: JSON.stringify(body),
});

const deleteRequest = (path) => request(path, { method: "DELETE" });

const seedUser = async () => {
  await postJson("/api/v1/auth/register", {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    age: 25,
  });
};

const seedCourse = async () => {
  await postJson("/api/v1/course", {
    name: "JavaScript Basics",
    topics: ["variables", "functions"],
    duration: 12,
    price: 499,
    thumbnail: "uploads/thumbnails/js.png",
  });
};

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

beforeEach(() => {
  resetTestStore();
});

describe("backend API", () => {
  it("returns the health response", async () => {
    const { response, body } = await request("/");

    assert.equal(response.status, 200);
    assert.deepEqual(body, { message: "Server is running" });
  });

  it("registers and logs in a user without returning the password hash", async () => {
    const register = await postJson("/api/v1/auth/register", {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      age: 25,
    });

    assert.equal(register.response.status, 201);
    assert.equal(register.body.success, true);

    const login = await postJson("/api/v1/auth/login", {
      email: "test@example.com",
      password: "password123",
    });

    assert.equal(login.response.status, 200);
    assert.equal(login.body.data.email, "test@example.com");
    assert.equal(login.body.data.password, undefined);
  });

  it("rejects duplicate users and invalid login credentials", async () => {
    await seedUser();

    const duplicate = await postJson("/api/v1/auth/register", {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      age: 25,
    });

    assert.equal(duplicate.response.status, 409);
    assert.equal(duplicate.body.success, false);

    const login = await postJson("/api/v1/auth/login", {
      email: "test@example.com",
      password: "wrongpass123",
    });

    assert.equal(login.response.status, 401);
    assert.equal(login.body.success, false);
  });

  it("lists, fetches, updates, and deletes users", async () => {
    await seedUser();

    const list = await request("/api/v1/users");
    assert.equal(list.response.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.data[0].password, undefined);

    const single = await request("/api/v1/users/1");
    assert.equal(single.response.status, 200);
    assert.equal(single.body.data.email, "test@example.com");

    const update = await patchJson("/api/v1/users/1", {
      name: "Updated User",
      password: "newpassword123",
    });
    assert.equal(update.response.status, 200);
    assert.equal(update.body.data.name, "Updated User");
    assert.equal(update.body.data.password, undefined);

    const login = await postJson("/api/v1/auth/login", {
      email: "test@example.com",
      password: "newpassword123",
    });
    assert.equal(login.response.status, 200);

    const remove = await deleteRequest("/api/v1/users/1");
    assert.equal(remove.response.status, 200);

    const afterDelete = await request("/api/v1/users");
    assert.equal(afterDelete.body.data.length, 0);
  });

  it("returns not implemented for forgot password", async () => {
    const { response, body } = await postJson("/api/v1/auth/forgot-password", {
      email: "test@example.com",
    });

    assert.equal(response.status, 501);
    assert.equal(body.success, false);
  });

  it("creates, lists, updates, and deletes courses", async () => {
    await seedCourse();

    const list = await request("/api/v1/course");
    assert.equal(list.response.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.data[0].name, "JavaScript Basics");

    const update = await patchJson("/api/v1/course/1", {
      name: "Advanced JavaScript",
      price: 799,
    });
    assert.equal(update.response.status, 200);

    const afterUpdate = await request("/api/v1/course");
    assert.equal(afterUpdate.body.data[0].name, "Advanced JavaScript");
    assert.equal(afterUpdate.body.data[0].price, "799");

    const remove = await request("/api/v1/course/1", { method: "DELETE" });
    assert.equal(remove.response.status, 200);

    const afterDelete = await request("/api/v1/course");
    assert.equal(afterDelete.body.data.length, 0);
  });

  it("lets a user buy an existing course", async () => {
    await seedUser();
    await seedCourse();

    const purchase = await postJson("/api/v1/course/buy", {
      userId: 1,
      courseId: 1,
      price: 499,
    });

    assert.equal(purchase.response.status, 201);
    assert.equal(purchase.body.success, true);
  });

  it("creates, lists, fetches, updates, and deletes course-taken records", async () => {
    await seedUser();
    await seedCourse();

    const create = await postJson("/api/v1/course-taken", {
      userId: 1,
      courseId: 1,
      price: 499,
    });
    assert.equal(create.response.status, 201);

    const list = await request("/api/v1/course-taken");
    assert.equal(list.response.status, 200);
    assert.equal(list.body.data.length, 1);

    const single = await request("/api/v1/course-taken/1");
    assert.equal(single.response.status, 200);
    assert.equal(single.body.data.userId, 1);

    const update = await patchJson("/api/v1/course-taken/1", { price: 299 });
    assert.equal(update.response.status, 200);
    assert.equal(update.body.data.price, "299");

    const remove = await deleteRequest("/api/v1/course-taken/1");
    assert.equal(remove.response.status, 200);

    const afterDelete = await request("/api/v1/course-taken");
    assert.equal(afterDelete.body.data.length, 0);
  });

  it("creates, lists, fetches, updates, and deletes discounts", async () => {
    await seedCourse();

    const create = await postJson("/api/v1/discounts", {
      courseId: 1,
      discount: 25,
    });
    assert.equal(create.response.status, 201);

    const list = await request("/api/v1/discounts");
    assert.equal(list.response.status, 200);
    assert.equal(list.body.data[0].discount, "25");

    const single = await request("/api/v1/discounts/1");
    assert.equal(single.response.status, 200);
    assert.equal(single.body.data.courseId, 1);

    const update = await patchJson("/api/v1/discounts/1", { discount: 35 });
    assert.equal(update.response.status, 200);
    assert.equal(update.body.data.discount, "35");

    const remove = await deleteRequest("/api/v1/discounts/1");
    assert.equal(remove.response.status, 200);

    const afterDelete = await request("/api/v1/discounts");
    assert.equal(afterDelete.body.data.length, 0);
  });

  it("creates, lists, updates, and deletes chapters for a course", async () => {
    await seedCourse();

    const create = await postJson("/api/v1/course/1/chapters", {
      chapterName: "Introduction",
      chapterNumber: 1,
      thumbnail: "uploads/thumbnails/chapter.png",
      videoUrl: "uploads/courses/intro.mp4",
    });
    assert.equal(create.response.status, 201);

    const list = await request("/api/v1/course/1/chapters");
    assert.equal(list.response.status, 200);
    assert.equal(list.body.data.length, 1);

    const update = await putJson("/api/v1/course/1/chapters/1", {
      chapterName: "Getting Started",
    });
    assert.equal(update.response.status, 200);

    const afterUpdate = await request("/api/v1/course/1/chapters");
    assert.equal(afterUpdate.body.data[0].chapterName, "Getting Started");

    const remove = await deleteRequest("/api/v1/course/1/chapters/1");
    assert.equal(remove.response.status, 200);

    const afterDelete = await request("/api/v1/course/1/chapters");
    assert.equal(afterDelete.body.data.length, 0);
  });

  it("creates, lists, fetches, updates, and deletes assignments", async () => {
    await seedCourse();
    await postJson("/api/v1/course/1/chapters", {
      chapterName: "Introduction",
      chapterNumber: 1,
      thumbnail: "uploads/thumbnails/chapter.png",
      videoUrl: "uploads/courses/intro.mp4",
    });

    const nestedCreate = await postJson("/api/v1/chapters/1/assignments", {});
    assert.equal(nestedCreate.response.status, 201);

    const nestedList = await request("/api/v1/chapters/1/assignments");
    assert.equal(nestedList.response.status, 200);
    assert.equal(nestedList.body.data.length, 1);

    const rootList = await request("/api/v1/assignments");
    assert.equal(rootList.response.status, 200);
    assert.equal(rootList.body.data.length, 1);

    const single = await request("/api/v1/assignments/1");
    assert.equal(single.response.status, 200);
    assert.equal(single.body.data.chapter, 1);

    await postJson("/api/v1/course/1/chapters", {
      chapterName: "Second Chapter",
      chapterNumber: 2,
      thumbnail: "uploads/thumbnails/chapter-2.png",
      videoUrl: "uploads/courses/second.mp4",
    });

    const update = await patchJson("/api/v1/assignments/1", { chapter: 2 });
    assert.equal(update.response.status, 200);
    assert.equal(update.body.data.chapter, 2);

    const remove = await deleteRequest("/api/v1/assignments/1");
    assert.equal(remove.response.status, 200);

    const afterDelete = await request("/api/v1/assignments");
    assert.equal(afterDelete.body.data.length, 0);
  });

  it("rejects missing relationship targets", async () => {
    const purchase = await postJson("/api/v1/course-taken", {
      userId: 1,
      courseId: 1,
      price: 499,
    });
    assert.equal(purchase.response.status, 404);

    const discount = await postJson("/api/v1/discounts", {
      courseId: 99,
      discount: 10,
    });
    assert.equal(discount.response.status, 404);

    const assignment = await postJson("/api/v1/assignments", {
      chapter: 99,
    });
    assert.equal(assignment.response.status, 404);
  });

  it("returns validation errors and 404 responses consistently", async () => {
    const invalidCourse = await postJson("/api/v1/course", {
      name: "J",
      topics: [],
      duration: 0,
      price: -1,
      thumbnail: "",
    });

    assert.equal(invalidCourse.response.status, 400);
    assert.equal(invalidCourse.body.success, false);
    assert.ok(invalidCourse.body.errors.length > 0);

    const missing = await request("/api/v1/unknown");
    assert.equal(missing.response.status, 404);
    assert.equal(missing.body.success, false);
  });
});
