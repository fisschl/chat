import { db } from "~~/server/utils/drizzle";
import { authTokens, users } from "~~/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { H3Event } from "h3";
import { LOGIN_TOKEN_KEY } from "./login";
import { first, omit } from "radashi";

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
  const result = await db
    .select()
    .from(authTokens)
    .innerJoin(users, eq(authTokens.userId, users.userId))
    .where(and(eq(authTokens.token, token), gt(authTokens.expiresAt, new Date())))
    .limit(1);
  const user = first(result)?.users;
  if (!user) throw createError({ statusCode: 401, message: "用户未登录" });
  // 返回用户信息（排除密码）
  return omit(user, ["password"]);
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
 * 获取当前登录用户信息
 *
 * @param event - Nitro 事件对象
 * @returns 当前用户的基本信息（不包含敏感字段）
 * @throws 401 错误 - 当用户未登录时
 */
export default defineEventHandler(async (event) => {
  // 验证用户认证状态并获取用户信息
  const user = await getCurrentUser(event);
  const token = getAuthToken(event);

  // 异步更新令牌的最后使用时间
  db.update(authTokens).set({ lastUsedAt: new Date() }).where(eq(authTokens.token, token!));

  // 返回用户信息（排除密码字段）
  return user;
});
