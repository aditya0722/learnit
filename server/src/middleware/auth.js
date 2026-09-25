import { verifyAccessToken, verifyRefreshToken, generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { setTokenCookies } from "../utils/cookies.js";
import { ApiError } from "../utils/ApiError.js";
import { db } from "../index.js";
import { eq, and, gt } from "drizzle-orm";
import { refreshTokensTable } from "../db/schemas/refreshTokens.js";
import { usersTable } from "../db/schemas/users.js";

export const authenticate = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.access_token;

    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken);
        const user = await db
          .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role })
          .from(usersTable)
          .where(eq(usersTable.id, payload.id))
          .limit(1);

        if (user.length === 0) {
          throw new ApiError(401, "User not found");
        }

        req.user = user[0];
        return next();
      } catch (jwtError) {
        if (jwtError.name !== "TokenExpiredError") {
          throw new ApiError(401, "Invalid access token");
        }
      }
    }

    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new ApiError(401, "Authentication required");
    }

    let refreshPayload;
    try {
      refreshPayload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "Invalid refresh token");
    }

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
      throw new ApiError(401, "Refresh token has been revoked");
    }

    const user = await db
      .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, refreshPayload.id))
      .limit(1);

    if (user.length === 0) {
      throw new ApiError(401, "User not found");
    }

    await db
      .update(refreshTokensTable)
      .set({ revoked: true })
      .where(eq(refreshTokensTable.id, storedToken[0].id));

    const newAccessToken = generateAccessToken(user[0]);
    const newRefreshToken = generateRefreshToken(user[0]);

    const { getRefreshTokenExpiry } = await import("../utils/token.js");
    await db.insert(refreshTokensTable).values({
      token: newRefreshToken,
      userId: user[0].id,
      expiresAt: getRefreshTokenExpiry(),
    });

    setTokenCookies(res, newAccessToken, newRefreshToken);

    req.user = user[0];
    return next();
  } catch (error) {
    next(error);
  }
};
