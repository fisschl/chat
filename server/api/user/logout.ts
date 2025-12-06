import { db } from "~~/server/utils/drizzle";
import { authTokens } from "~~/db/schema";
import { eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { LOGIN_TOKEN_KEY } from "./login";

/**
 * 登出当前用户
 *
 * @param event - Nitro 事件对象
 */
export async function logout(event: H3Event) {
  const token = getAuthToken(event);
  if (!token) return;

  // 从数据库中删除令牌
  await db.delete(authTokens).where(eq(authTokens.token, token));

  // 清除 cookie
  deleteCookie(event, LOGIN_TOKEN_KEY);
}

export default defineEventHandler(async (event) => {
  // 执行登出操作
  await logout(event);

  return {
    success: true,
    message: "已成功登出",
  };
});
