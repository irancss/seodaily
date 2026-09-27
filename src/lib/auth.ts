import "server-only";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db, schema } from "@/db";

import { SESSION_COOKIE, sessionKey } from "./session-key";

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

export async function createSession(userId: number) {
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(sessionKey());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in admin, or null. Verifies the token and that the user still exists. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionKey());
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    return user ? { id: user.id, email: user.email, name: user.name } : null;
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
