import { drizzle } from "drizzle-orm/node-postgres";

const { DATABASE_URL } = process.env;

export const db = drizzle(DATABASE_URL!);
