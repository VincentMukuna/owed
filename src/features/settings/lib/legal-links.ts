const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? "https://tryowed.vercel.app").replace(
  /\/$/,
  "",
);

export { SITE_URL };

export const TERMS_OF_USE_URL = `${SITE_URL}/terms`;
export const PRIVACY_POLICY_URL = `${SITE_URL}/privacy`;
