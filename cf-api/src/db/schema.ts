import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { desc, sql } from "drizzle-orm";


export const userProfiles = sqliteTable("userProfiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  uuid: text("uuid").notNull().unique(),

  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  full_name: text("full_name").notNull(),
  avatar_url: text("avatar_url"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),

  updated_at: text("updated_at"),

  email_notifications: text("email_notifications"),

  email: text("email").notNull(), 
});