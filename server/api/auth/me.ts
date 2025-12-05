import { getCurrentUser, getAuthToken } from "~~/server/utils/auth";
import { prisma } from "~~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  // 验证用户认证状态并获取用户信息
  const user = await getCurrentUser(event);
  const token = getAuthToken(event);

  // 异步更新令牌的最后使用时间
  prisma.authToken.update({
    where: { token: token! },
    data: { lastUsedAt: new Date() },
  });

  // 返回用户信息（排除密码字段）
  return user;
});
