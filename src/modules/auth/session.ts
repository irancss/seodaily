import "server-only";

import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { and, eq, gt, lt, ne } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db, schema } from "@/db";

import { SESSION_COOKIE, sessionKey } from "@/modules/auth/session-key";

const SESSION_DAYS = 7;

export async function verifyCredentials(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email.trim().toLowerCase()),
  });
  // Compare against a dummy hash when the user is missing so timing does not
  // reveal which emails exist.
  const hash = user?.passwordHash ?? "$2b$12$e0iqfgVMNqMyH7.Amn1qhurHdc3/AUie98P53BYY6QxWUaKRc/Lve";
  const ok = await bcrypt.compare(password, hash);
  return ok && user ? user : null;
}

/** Secure cookies whenever the visitor is on HTTPS (the proxy sets X-Forwarded-Proto), or when forced. */
async function secureCookie() {
  if (process.env.COOKIE_SECURE === "true") return true;
  return (await headers()).get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

/** The session id and user id in the signed cookie, or null. */
async function readToken() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey());
    const userId = Number(payload.sub);
    const sid = typeof payload.sid === "string" ? payload.sid : "";
    return Number.isInteger(userId) && sid ? { userId, sid } : null;
  } catch {
    return null;
  }
}

export async function createSession(userId: number) {
  const sid = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  // Expired rows are only kept until the next login.
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()));
  await db.insert(schema.sessions).values({ id: sid, userId, expiresAt });

  const token = await new SignJWT({ sub: String(userId), sid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(sessionKey());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await secureCookie(),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Logs out: the session row is deleted, so a copied cookie stops working too. */
export async function destroySession() {
  const token = await readToken();
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, token.sid));
  (await cookies()).delete(SESSION_COOKIE);
}

/** Revokes every other session of the user (after a password change). */
export async function revokeOtherSessions(userId: number) {
  const token = await readToken();
  await db
    .delete(schema.sessions)
    .where(and(eq(schema.sessions.userId, userId), token ? ne(schema.sessions.id, token.sid) : undefined));
}

/** The signed-in admin, or null. Verifies the token, that its session is live and that the user still exists. */
export const getCurrentUser = cache(async () => {
  const token = await readToken();
  if (!token) return null;
  try {
    const [row] = await db
      .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
      .where(
        and(
          eq(schema.sessions.id, token.sid),
          eq(schema.sessions.userId, token.userId),
          gt(schema.sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
});

/** Use at the top of every admin page and server action. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
