const isProduction = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
};

export const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie("access_token", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearTokenCookies = (res) => {
  res.clearCookie("access_token", { ...COOKIE_OPTIONS });
  res.clearCookie("refresh_token", { ...COOKIE_OPTIONS });
};
