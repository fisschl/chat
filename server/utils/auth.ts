import { prisma } from "./prisma";
import { LOGIN_TOKEN_KEY } from "~~/server/api/auth/login";
import type { H3Event } from "h3";
import { omit } from "radashi";

/**
 * 从请求中获取认证令牌
 *
 * @param event - Nitro 事件对象
 * @returns 令牌字符串或 null
 */
export function getAuthToken(event: H3Event) {
  const cookieToken = getCookie(event, LOGIN_TOKEN_KEY);
  return cookieToken || null;
}

/**
 * 验证令牌并返回用户信息
 *
 * @param token - 认证令牌
 * @returns 用户信息（不包含密码）或 null
 * @throws 401 错误 - 当令牌无效或已过期时
 */
export async function verifyAuthToken(token: string) {
  // 查找有效的令牌
  const authToken = await prisma.authToken.findFirst({
    where: {
      token,
      expiresAt: {
        gt: new Date(), // 令牌未过期
      },
    },
    include: {
      user: true,
    },
  });

  if (!authToken) throw createError({ statusCode: 401, message: "用户未登录" });

  // 返回用户信息（排除密码）
  return omit(authToken.user, ["password"]);
}

/**
 * 获取当前认证的用户
 *
 * @param event - Nitro 事件对象
 * @returns 用户信息（不包含密码）
 * @throws 401 错误 - 当用户未登录时
 */
export async function getCurrentUser(event: H3Event) {
  const token = getAuthToken(event);
  if (!token) throw createError({ statusCode: 401, message: "用户未登录" });
  return await verifyAuthToken(token);
}

/**
 * 登出当前用户
 *
 * @param event - Nitro 事件对象
 */
export async function logout(event: H3Event) {
  const token = getAuthToken(event);
  if (!token) return;

  // 从数据库中删除令牌
  await prisma.authToken.delete({
    where: { token },
  });

  // 清除 cookie
  deleteCookie(event, LOGIN_TOKEN_KEY);
}
