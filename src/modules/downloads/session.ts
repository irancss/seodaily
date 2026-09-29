import "server-only";

import { cookies } from "next/headers";

import { downloadConfig } from "./config";
import { sessionFromToken, type DownloadSession } from "./otp";

// The download session cookie: opaque, HttpOnly, SameSite=Lax, Secure in
// production, a fixed 30-day expiry from verification. It is separate from
// the admin session and grants no admin access.

export const DOWNLOAD_COOKIE = "sd_dl";

export async function getDownloadSession(): Promise<DownloadSession | null> {
  const jar = await cookies();
  return sessionFromToken(jar.get(DOWNLOAD_COOKIE)?.value);
}

export async function setDownloadCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(DOWNLOAD_COOKIE, token, { httpOnly: true, secure: downloadConfig().cookieSecure, sameSite: "lax", path: "/", expires: expiresAt });
}

export async function clearDownloadCookie() {
  const jar = await cookies();
  jar.delete(DOWNLOAD_COOKIE);
}
