export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const guestRegex = /^guest-\d+$/;
export const DUMMY_PASSWORD = "";

export const suggestions = [
  "Plan a 5-day trip to Paris",
  "Plan a 3-day trip to Tokyo",
  "Plan a week in New York City",
  "Plan a 4-day trip to Barcelona",
];
