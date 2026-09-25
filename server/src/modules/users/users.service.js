import { eq } from "drizzle-orm";
import { db } from "../../index.js";
import { usersTable } from "../../db/schemas/users.js";
import { ApiError } from "../../utils/ApiError.js";
import { testStore } from "../../db/testStore.js";

const publicUser = ({ password, ...user }) => user;

export const getUsers = async () => {
  if (process.env.NODE_ENV === "test") {
    return testStore.users.map(publicUser);
  }

  const users = await db.select().from(usersTable);
  return users.map(publicUser);
};

export const getUserById = async (id) => {
  const users = process.env.NODE_ENV === "test"
    ? testStore.users.filter((user) => user.id === Number(id))
    : await db.select().from(usersTable).where(eq(usersTable.id, id));

  if (users.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return publicUser(users[0]);
};

export const updateUser = async (id, data) => {
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );

  if (cleanData.email) {
    const existingUser = process.env.NODE_ENV === "test"
      ? testStore.users.find((user) => user.email === cleanData.email && user.id !== Number(id))
      : (await db.select().from(usersTable).where(eq(usersTable.email, cleanData.email)))[0];

    if (existingUser && existingUser.id !== Number(id)) {
      throw new ApiError(409, "Email already exists");
    }
  }

  if (process.env.NODE_ENV === "test") {
    const user = testStore.users.find((record) => record.id === Number(id));

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    Object.assign(user, cleanData);
    return publicUser(user);
  }

  await db.update(usersTable).set(cleanData).where(eq(usersTable.id, id));
  return getUserById(id);
};

export const deleteUser = async (id) => {
  if (process.env.NODE_ENV === "test") {
    const index = testStore.users.findIndex((user) => user.id === Number(id));

    if (index === -1) {
      throw new ApiError(404, "User not found");
    }

    testStore.users.splice(index, 1);
    testStore.courseTaken = testStore.courseTaken.filter((purchase) => purchase.userId !== Number(id));
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
};
