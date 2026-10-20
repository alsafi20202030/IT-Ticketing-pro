import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "it-desk-default-secret-change-in-production";
const AUTH_COOKIE = "itdesk_token";

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "14d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.helpdeskUser.findUnique({
    where: { id: payload.userId },
    include: { department: true },
  });

  if (!user || !user.isActive || !user.isApproved) {
    return null;
  }

  return user;
}

export async function requireAuth(roles?: string[]) {
  const user = await getSessionUser();
  if (!user) {
    return { error: "غير مصرح بالدخول", status: 401, user: null };
  }
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return { error: "لا تملك الصلاحية لتنفيذ هذا الإجراء", status: 403, user: null };
  }
  return { error: null, status: 200, user };
}

export { AUTH_COOKIE };
