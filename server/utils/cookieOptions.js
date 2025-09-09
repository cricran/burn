// Centralized options for the auth cookie
// Defaults to a 12-month persistent cookie, configurable via env
// JWT_COOKIE_MAX_AGE_MS can override the duration in milliseconds

const DEFAULT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

export const authCookieOptions = () => {
  const maxAge = Number(process.env.JWT_COOKIE_MAX_AGE_MS) > 0
    ? Number(process.env.JWT_COOKIE_MAX_AGE_MS)
    : DEFAULT_MAX_AGE_MS;

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'Lax' : 'Lax',
    maxAge,
    expires: new Date(Date.now() + maxAge),
    path: '/',
  };
};

export default authCookieOptions;
