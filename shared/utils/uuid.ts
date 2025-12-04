import { base32crockford } from "@scure/base";
import { parse, v7 } from "uuid";

export const longToken = () => {
  // 生成 UUID v7 并解析为字节数组
  const uuidBytes = parse(v7());
  // 生成8字节的随机数
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  // 合并两个字节数组
  const bytes = new Uint8Array([...uuidBytes, ...randomBytes]);
  // 使用 base32crockford 编码并转换为小写
  return base32crockford.encode(bytes).toLowerCase();
};
