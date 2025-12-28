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
  
  // User login tracking information (stored as JSON text)
  user_login_info: text("user_login_info"),
});

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Booking identifier
  booking_id: text("booking_id").notNull().unique(),
  
  // User reference
  user_uuid: text("user_uuid").notNull(),
  
  // Customer details (stored as JSON array)
  customers: text("customers").notNull(), // Array of {name, age, gender, phone, email}
  
  // Address details (stored as JSON)
  address: text("address").notNull(), // {line1, line2, locality, landmark, city, state, pinCode}
  
  // Booking schedule
  booking_date: text("booking_date").notNull(),
  time_slot: text("time_slot").notNull(),
  
  // Packages/items booked (stored as JSON array)
  packages: text("packages").notNull(), // Array of cart items
  
  // Pricing
  total_price: real("total_price").notNull(),
  
  // Coupon applied (stored as JSON, nullable)
  coupon: text("coupon"), // {code, discount}
  
  // Payment
  payment_method: text("payment_method").notNull(), // 'prepaid' or 'postpaid'
  payment_status: text("payment_status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  
  // Booking status
  status: text("status").notNull().default("confirmed"), // 'confirmed', 'completed', 'cancelled'
  
  // Timestamps
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  
  updated_at: text("updated_at"),
});