import argon2 from "argon2";
import { addDays } from "date-fns";
import { longToken } from "~~/shared/utils/uuid";
import { prisma } from "~~/server/utils/prisma";
import { email, object, optional, string } from "zod/mini";
import { omit } from "radashi";
import { LOGIN_TOKEN_KEY } from "./login";

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
    const user = await prisma.user.findFirst({
      where: { userName: body.userName },
    });
    if (user) throw createError({ statusCode: 409, message: "用户名已存在" });
  }

  // 检查邮箱是否已存在（如果提供）
  if (body.email) {
    const user = await prisma.user.findFirst({
      where: { email: body.email },
    });
    if (user) throw createError({ statusCode: 409, message: "邮箱已被注册" });
  }

  // 检查手机号是否已存在（如果提供）
  if (body.phone) {
    const user = await prisma.user.findFirst({
      where: { phone: body.phone },
    });
    if (user) throw createError({ statusCode: 409, message: "手机号已被注册" });
  }

  // 创建用户
  const user = await prisma.user.create({
    data: {
      userName: body.userName,
      email: body.email || null,
      phone: body.phone || null,
      password: await argon2.hash(body.password),
    },
  });

  // 生成 longToken
  const token = longToken();

  // 计算过期时间（60天后）
  const expiresAt = addDays(new Date(), 60);

  // 存储 token 到数据库
  await prisma.authToken.create({
    data: {
      token,
      userId: user.userId,
      expiresAt,
    },
  });

  // 设置 cookie（60天有效期）
  setCookie(event, LOGIN_TOKEN_KEY, token, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 60,
  });

  return omit(user, ["password"]);
});
