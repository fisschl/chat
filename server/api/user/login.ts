import argon2 from "argon2";
import { addDays } from "date-fns";
import { longToken } from "~~/shared/utils/uuid";
import { db } from "~~/server/utils/drizzle";
import { users, authTokens } from "~~/db/schema";
import { or, eq } from "drizzle-orm";
import { object, string } from "zod/mini";
import { omit } from "radashi";

const LoginRequest = object({
  loginText: string(),
  password: string(),
});

export const LOGIN_TOKEN_KEY = "chat-auth-token";

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, LoginRequest.parse);

  // 查询匹配的用户（用户名、邮箱、手机号）
  const userList = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.userName, body.loginText),
        eq(users.email, body.loginText),
        eq(users.phone, body.loginText),
      ),
    );

  if (!userList.length)
    throw createError({ statusCode: 401, message: "用户名、邮箱或手机号不存在" });

  const findUser = async () => {
    for (const user of userList) {
      const isPasswordValid = await argon2.verify(user.password, body.password);
      if (isPasswordValid) return user;
    }
  };

  const user = await findUser();

  if (!user) throw createError({ statusCode: 401, message: "密码错误" });

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
