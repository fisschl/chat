import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * 用户表
 * 存储系统用户的基本信息
 */
export const users = pgTable("users", {
  /** 用户唯一标识符 */
  userId: uuid("user_id").primaryKey(),
  /** 用户姓名，必填字段，用于显示用户名称 */
  userName: varchar("user_name", { length: 255 }).notNull(),
  /** 用户邮箱地址，可选字段，具有唯一性约束 */
  email: varchar("email", { length: 255 }).unique(),
  /** 用户手机号码，可选字段，具有唯一性约束 */
  phone: varchar("phone", { length: 50 }).unique(),
  /** 用户密码，必填字段，使用 argon2 加密存储 */
  password: varchar("password", { length: 255 }).notNull(),
  /** 用户头像，可选字段，存储用户头像的 URL */
  avatar: text("avatar"),
  /** 创建时间，自动记录用户创建时间 */
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * 认证令牌表
 * 存储用户的认证令牌信息
 */
export const authTokens = pgTable(
  "auth_tokens",
  {
    /** 令牌值，主键字段，使用 longToken 生成的唯一令牌 */
    token: varchar("token", { length: 255 }).primaryKey(),
    /** 关联的用户ID，必填字段，外键关联到 User 表 */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    /** 创建时间，自动记录令牌创建时间 */
    createdAt: timestamp("created_at").notNull().defaultNow(),
    /** 最后使用时间，记录令牌最后一次被使用的时间 */
    lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
    /** 过期时间 */
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => [
    index("auth_tokens_user_id_idx").on(table.userId),
    index("auth_tokens_expires_at_idx").on(table.expiresAt),
    index("auth_tokens_last_used_at_idx").on(table.lastUsedAt),
  ],
);

/**
 * 频道类型枚举
 * 定义频道的三种类型
 */
export const channelTypeEnum = pgEnum("channel_type", ["public", "private", "direct"]);

/**
 * 频道表
 * 存储频道的基本信息
 */
export const channels = pgTable(
  "channels",
  {
    /** 频道唯一标识符 */
    channelId: uuid("channel_id").primaryKey(),
    /** 频道名称，必填字段，用于显示频道名称 */
    name: varchar("name", { length: 255 }).notNull(),
    /** 频道描述，可选字段，描述频道用途 */
    description: text("description"),
    /** 频道类型，支持公开、私密、直接消息三种类型 */
    type: channelTypeEnum("type").notNull().default("public"),
    /** 频道头像，可选字段，存储频道头像的 URL */
    avatar: text("avatar"),
    /** 创建时间，自动记录频道创建时间 */
    createdAt: timestamp("created_at").notNull().defaultNow(),
    /** 创建者 ID */
    creatorId: uuid("creator_id").notNull(),
  },
  (table) => [
    index("channels_type_idx").on(table.type),
    index("channels_created_at_idx").on(table.createdAt),
  ],
);

/**
 * 消息表
 * 存储消息的基本信息和元数据
 */
export const messages = pgTable(
  "messages",
  {
    /** 消息唯一标识符，使用 UUID v7 作为默认值 */
    messageId: uuid("message_id").primaryKey(),
    /** 频道ID，必填字段，外键关联到 Channel 表 */
    channelId: uuid("channel_id")
      .notNull()
      .references(() => channels.channelId, { onDelete: "cascade" }),
    /** 发送者用户 ID */
    creatorId: uuid("creator_id").notNull(),
    /** 创建时间，自动记录消息发送时间 */
    createdAt: timestamp("created_at").notNull().defaultNow(),
    /** 更新时间，自动记录消息编辑时间 */
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("messages_channel_id_idx").on(table.channelId),
    index("messages_created_at_idx").on(table.createdAt),
    index("messages_channel_id_created_at_idx").on(table.channelId, table.createdAt),
  ],
);

/**
 * 文本内容表
 * 存储消息的文本内容
 */
export const textContents = pgTable(
  "text_contents",
  {
    /** 文本内容唯一标识符，使用 UUID v7 作为默认值 */
    contentId: uuid("content_id").primaryKey(),
    /** 关联的消息ID，必填字段，外键关联到 Message 表 */
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.messageId, { onDelete: "cascade" }),
    /** 文本内容，必填字段，存储文本消息内容 */
    content: text("content").notNull(),
    /** 排序序号，用于确定内容在消息中的显示顺序 */
    order: integer("order").notNull().default(0),
  },
  (table) => [
    index("text_contents_message_id_idx").on(table.messageId),
    index("text_contents_message_id_order_idx").on(table.messageId, table.order),
  ],
);

/**
 * 文件内容表
 * 存储消息的文件内容
 */
export const fileContents = pgTable(
  "file_contents",
  {
    /** 文件内容唯一标识符，使用 UUID v7 作为默认值 */
    contentId: uuid("content_id").primaryKey(),
    /** 关联的消息ID，必填字段，外键关联到 Message 表 */
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.messageId, { onDelete: "cascade" }),
    /** 文件URL，必填字段，存储文件的访问地址 */
    url: text("url").notNull(),
    /** 文件名称，必填字段，存储文件的原始名称 */
    name: varchar("name", { length: 255 }).notNull(),
    /** 文件大小（字节），必填字段，存储文件的大小 */
    size: integer("size").notNull(),
    /** 文件MIME类型，必填字段，存储文件的MIME类型 */
    mimeType: varchar("mime_type", { length: 255 }).notNull(),
    /** 排序序号，用于确定内容在消息中的显示顺序 */
    order: integer("order").notNull().default(0),
  },
  (table) => [
    index("file_contents_message_id_idx").on(table.messageId),
    index("file_contents_message_id_order_idx").on(table.messageId, table.order),
    index("file_contents_mime_type_idx").on(table.mimeType),
  ],
);
