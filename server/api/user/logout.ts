import { logout } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  // 执行登出操作
  await logout(event);

  return {
    success: true,
    message: "已成功登出",
  };
});
