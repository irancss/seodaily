// Shared by the Node server and proxy.ts, so it must stay free of Node-only imports.

export const SESSION_COOKIE = "sd_session";

let warned = false;

export function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set to at least 32 characters");
    }
    if (!warned) {
      console.warn("SESSION_SECRET is not set; using an insecure development key");
      warned = true;
    }
    return new TextEncoder().encode("insecure-development-session-key-change-me");
  }
  return new TextEncoder().encode(secret);
}
