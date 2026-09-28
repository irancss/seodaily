// In production a missing or weak setting stops the server with a clear
// message, instead of starting with the local development fallbacks
// (localhost database, insecure session key).
if (process.env.NODE_ENV === "production") {
  const problems: string[] = [];
  if (!process.env.DATABASE_URL) problems.push("DATABASE_URL is not set");
  if ((process.env.SESSION_SECRET ?? "").length < 32) problems.push("SESSION_SECRET must be at least 32 characters");
  if (problems.length > 0) {
    console.error(`Invalid configuration:\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  if (!process.env.SITE_URL) console.warn("SITE_URL is not set; canonical URLs use the admin setting or https://seodaily.ir");
}

export {};
