import { db } from "~~/server/utils/drizzle";
import { users } from "~~/db/schema";
import { eq } from "drizzle-orm";
import { object, string } from "zod/mini";
import { first, pick } from "radashi";

/**
 * 查询参数验证 schema
 * 用于验证获取用户信息的查询参数
 */
const GetUserQuery = object({
  userId: string(),
});

/**
 * 根据用户ID查询用户信息
 *
 * @param event - Nitro 事件对象
 * @returns 用户基本信息（不包含敏感字段）
 * @throws 404 错误 - 当用户不存在时
 */
export default defineEventHandler(async (event) => {
  // 验证查询参数
  const query = await getValidatedQuery(event, GetUserQuery.parse);
  // 查询用户信息
  const userList = await db
    .select(pick(users, ["userId", "userName", "avatar"]))
    .from(users)
    .where(eq(users.userId, query.userId))
    .limit(1);
  const user = first(userList);
  // 如果用户不存在，返回 404 错误
  if (!user) throw createError({ statusCode: 404, message: "用户不存在" });
  // 返回用户信息（不包含敏感字段）
  return user;
});
