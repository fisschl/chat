import { getCurrentUser, getAuthToken } from "~~/server/utils/auth";
import { db } from "~~/server/utils/drizzle";
import { authTokens } from "~~/db/schema";
import { eq } from "drizzle-orm";

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
