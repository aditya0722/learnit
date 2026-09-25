import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

export const getRefreshTokenExpiry = () => {
  const now = new Date();
  const parts = REFRESH_EXPIRY.match(/(\d+)([smhd])/);
  if (!parts) {
    now.setDate(now.getDate() + 7);
    return now;
  }
  const [, amount, unit] = parts;
  const n = Number(amount);
  switch (unit) {
    case "s": now.setSeconds(now.getSeconds() + n); break;
    case "m": now.setMinutes(now.getMinutes() + n); break;
    case "h": now.setHours(now.getHours() + n); break;
    case "d": now.setDate(now.getDate() + n); break;
  }
  return now;
};

export const getPasswordResetTokenExpiry = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now;
};
