import argon2 from "argon2";
import { addDays } from "date-fns";
import { longToken } from "~~/shared/utils/uuid";
import { db } from "~~/server/utils/drizzle";
import { users, authTokens } from "~~/db/schema";
import { eq } from "drizzle-orm";
import { email, object, optional, string } from "zod/mini";
import { first, omit } from "radashi";
import { LOGIN_TOKEN_KEY } from "./login";
import { v7 } from "uuid";

const RegisterRequest = object({
  userName: string(),
  email: optional(string().check(email())),
  phone: optional(string()),
  password: string(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, RegisterRequest.parse);

  // 检查用户名是否已存在
  {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.userName, body.userName))
      .limit(1);
    if (existingUser.length) throw createError({ statusCode: 409, message: "用户名已存在" });
  }

  // 检查邮箱是否已存在（如果提供）
  if (body.email) {
    const existingUser = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existingUser.length) throw createError({ statusCode: 409, message: "邮箱已被注册" });
  }

  // 检查手机号是否已存在（如果提供）
  if (body.phone) {
    const existingUser = await db.select().from(users).where(eq(users.phone, body.phone)).limit(1);
    if (existingUser.length) throw createError({ statusCode: 409, message: "手机号已被注册" });
  }

  // 创建用户
  const newUsers = await db
    .insert(users)
    .values({
      userId: v7(),
      userName: body.userName,
      email: body.email,
      phone: body.phone,
      password: await argon2.hash(body.password),
    })
    .returning();

  const user = first(newUsers)!;

  // 生成 longToken
  const token = longToken();

  // 计算过期时间（60天后）
  const expiresAt = addDays(new Date(), 60);

  // 存储 token 到数据库
  await db.insert(authTokens).values({
    token,
    userId: user.userId,
    expiresAt,
  });

  // 设置 cookie（60天有效期）
  setCookie(event, LOGIN_TOKEN_KEY, token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 60,
  });

  return omit(user, ["password"]);
});
