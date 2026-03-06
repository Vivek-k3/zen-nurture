const requiredEnvVars = ["TEST_EMAIL", "TEST_PASSWORD"];

const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    [
      "Test preflight failed.",
      `Missing required environment variables: ${missing.join(", ")}`,
      "Set TEST_EMAIL and TEST_PASSWORD before running pnpm test.",
    ].join("\n")
  );
  process.exit(1);
}

if (!process.env.TEST_BASE_URL) {
  process.env.TEST_BASE_URL = "http://127.0.0.1:3005";
}

console.log(`Test preflight passed for ${process.env.TEST_BASE_URL}`);

