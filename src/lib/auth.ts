import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "@/db";
import {
  sessions,
  users,
  userFeatureOverrides,
  featureFlags,
  entitlements,
} from "@/db/schema";
import type { AccountStatus } from "./constants";

const COOKIE = "cp_session";
const SESSION_DAYS = 7;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
  status: AccountStatus;
  country: string;
  currency: string;
  timezone: string;
  place: string | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createSession(user: SessionUser, meta?: { ip?: string; userAgent?: string }) {
  const token = newToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    userId: user.id,
    tokenHash,
    expiresAt,
    ip: meta?.ip ?? null,
    userAgent: meta?.userAgent ?? null,
  });
  const jwt = await new SignJWT({
    sub: user.id,
    role: user.role,
    status: user.status,
    name: user.fullName,
    th: tokenHash,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return jwt;
}

export async function clearSessionCookie() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey());
      const th = payload.th as string | undefined;
      if (th) {
        await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, th));
      }
    } catch {
      /* ignore */
    }
  }
  jar.set(COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0) });
}

export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.sub;
    const th = payload.th as string | undefined;
    if (!userId || !th) return null;
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.tokenHash, th), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
      .limit(1);
    if (!session) return null;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role === "admin" ? "admin" : "user",
      status: user.status as AccountStatus,
      country: user.country,
      currency: user.currency,
      timezone: user.timezone,
      place: user.place,
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" as const, status: 401 as const, user: null };
  }
  return { user, error: null, status: 200 as const };
}

export async function requireActiveUser() {
  const result = await requireUser();
  if (!result.user) return result;
  if (result.user.status !== "ACTIVE") {
    return { error: "Account is not active" as const, status: 403 as const, user: null };
  }
  return result;
}

export async function requireAdmin() {
  const result = await requireUser();
  if (!result.user) return result;
  if (result.user.role !== "admin") {
    return { error: "Forbidden" as const, status: 403 as const, user: null };
  }
  if (result.user.status !== "ACTIVE") {
    return { error: "Account is not active" as const, status: 403 as const, user: null };
  }
  return result;
}

export async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown",
    userAgent: h.get("user-agent") ?? "unknown",
    origin: h.get("origin"),
  };
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ ok: false, error: message, ...extra }, { status });
}

export function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return Response.json({ ok: true, ...data }, { status });
}

export async function isFeatureOn(key: string, userId?: string) {
  if (userId) {
    const [override] = await db
      .select()
      .from(userFeatureOverrides)
      .where(and(eq(userFeatureOverrides.userId, userId), eq(userFeatureOverrides.featureKey, key)))
      .limit(1);
    if (override) return override.enabled;
  }
  const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
  return flag ? flag.enabled : true;
}

export async function hasEbookEntitlement(userId: string) {
  const rows = await db
    .select()
    .from(entitlements)
    .where(and(eq(entitlements.userId, userId), eq(entitlements.status, "active")));
  if (rows.length === 0) {
    // Approved active accounts receive companion-app access by default until
    // a payment provider is connected. Purchase verification is stored separately.
    return true;
  }
  return rows.some((r) => r.productKey === "ebook" || r.productKey === "app");
}

export function mapUser(row: typeof users.$inferSelect): SessionUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role === "admin" ? "admin" : "user",
    status: row.status as AccountStatus,
    country: row.country,
    currency: row.currency,
    timezone: row.timezone,
    place: row.place,
  };
}
