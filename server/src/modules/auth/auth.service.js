import { eq, and, gt } from "drizzle-orm";
import { usersTable } from "../../db/schemas/users.js";
import { refreshTokensTable } from "../../db/schemas/refreshTokens.js";
import { passwordResetTokensTable } from "../../db/schemas/passwordResetTokens.js";
import { db } from "../../index.js";
import { checkHash } from "../../utils/bcrypt.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  getPasswordResetTokenExpiry,
} from "../../utils/token.js";
import { setTokenCookies, clearTokenCookies } from "../../utils/cookies.js";
import crypto from "crypto";

const publicUser = ({ password, ...user }) => user;

const TOKEN_BLACKLIST_ENABLED = true;

export const login = async (email, password, res) => {
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (user.length === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const check = await checkHash(password, user[0].password);
  if (!check) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(user[0]);
  const refreshToken = generateRefreshToken(user[0]);

  await db.insert(refreshTokensTable).values({
    token: refreshToken,
    userId: user[0].id,
    expiresAt: getRefreshTokenExpiry(),
  });

  if (res) {
    setTokenCookies(res, accessToken, refreshToken);
  }

  return publicUser(user[0]);
};

export const register = async ({ name, email, password, age }, res) => {
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existingUser.length > 0) {
    throw new ApiError(409, "Email already exists");
  }

  const result = await db.insert(usersTable).values({ name, email, password, age }).returning();

  const user = result[0];
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await db.insert(refreshTokensTable).values({
    token: refreshToken,
    userId: user.id,
    expiresAt: getRefreshTokenExpiry(),
  });

  if (res) {
    setTokenCookies(res, accessToken, refreshToken);
  }

  return publicUser(user);
};

export const refreshTokens = async (refreshToken, res) => {
  const storedToken = await db
    .select()
    .from(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.token, refreshToken),
        eq(refreshTokensTable.revoked, false),
        gt(refreshTokensTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (storedToken.length === 0) {
    throw new ApiError(401, "Invalid or revoked refresh token");
  }

  const { verifyRefreshToken } = await import("../../utils/token.js");
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (TOKEN_BLACKLIST_ENABLED) {
    await db
      .update(refreshTokensTable)
      .set({ revoked: true })
      .where(eq(refreshTokensTable.id, storedToken[0].id));
  }

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.id))
    .limit(1);

  if (user.length === 0) {
    throw new ApiError(401, "User not found");
  }

  const newAccessToken = generateAccessToken(user[0]);
  const newRefreshToken = generateRefreshToken(user[0]);

  await db.insert(refreshTokensTable).values({
    token: newRefreshToken,
    userId: user[0].id,
    expiresAt: getRefreshTokenExpiry(),
  });

  setTokenCookies(res, newAccessToken, newRefreshToken);

  return publicUser(user[0]);
};

export const logout = async (refreshToken, res) => {
  if (refreshToken) {
    await db
      .update(refreshTokensTable)
      .set({ revoked: true })
      .where(eq(refreshTokensTable.token, refreshToken));
  }

  if (res) {
    clearTokenCookies(res);
  }
};

export const changePassword = async (userId, currentPassword, newPassword, refreshToken, res) => {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (users.length === 0) {
    throw new ApiError(404, "User not found");
  }

  const user = users[0];
  const check = await checkHash(currentPassword, user.password);
  if (!check) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const { generateHash } = await import("../../utils/bcrypt.js");
  const hashedPassword = await generateHash(newPassword);

  await db
    .update(usersTable)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  await db
    .update(refreshTokensTable)
    .set({ revoked: true })
    .where(eq(refreshTokensTable.userId, userId));

  if (refreshToken) {
    await db
      .update(refreshTokensTable)
      .set({ revoked: true })
      .where(eq(refreshTokensTable.token, refreshToken));
  }

  if (res) {
    clearTokenCookies(res);
  }
};

export const requestPasswordReset = async (email) => {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (users.length === 0) {
    return { message: "If an account exists, a reset link has been sent" };
  }

  const user = users[0];
  const resetToken = crypto.randomBytes(32).toString("hex");

  await db.insert(passwordResetTokensTable).values({
    token: resetToken,
    userId: user.id,
    expiresAt: getPasswordResetTokenExpiry(),
  });

  return {
    message: "If an account exists, a reset link has been sent",
    resetToken,
    userId: user.id,
  };
};

export const confirmPasswordReset = async (token, newPassword) => {
  const storedToken = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.token, token),
        eq(passwordResetTokensTable.used, false),
        gt(passwordResetTokensTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (storedToken.length === 0) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const { generateHash } = await import("../../utils/bcrypt.js");
  const hashedPassword = await generateHash(newPassword);

  await db
    .update(usersTable)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(usersTable.id, storedToken[0].userId));

  await db
    .update(passwordResetTokensTable)
    .set({ used: true })
    .where(eq(passwordResetTokensTable.id, storedToken[0].id));

  await db
    .update(refreshTokensTable)
    .set({ revoked: true })
    .where(eq(refreshTokensTable.userId, storedToken[0].userId));
};

export const getMe = async (userId) => {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (users.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return publicUser(users[0]);
};
