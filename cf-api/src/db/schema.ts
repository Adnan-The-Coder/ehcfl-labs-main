import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";
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
  
  // Healthians integration tracking
  healthians_booking_id: text("healthians_booking_id"), // Healthians booking ID if synced
  healthians_sync_status: text("healthians_sync_status").notNull().default("pending"), // 'pending', 'synced', 'failed'
  healthians_sync_attempts: integer("healthians_sync_attempts").notNull().default(0),
  healthians_last_error: text("healthians_last_error"), // Last error message from Healthians API
  healthians_response: text("healthians_response"), // Full Healthians API response (JSON)
  
  // Timestamps
  created_at: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  
  updated_at: text("updated_at"),
});

// Logs for inbound Healthians webhooks (raw storage + processing state)
export const healthiansWebhookLogs = sqliteTable(
  "healthiansWebhookLogs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Optional event id provided by Healthians (if any)
    event_id: text("event_id"),

    // Deterministic hash of payload for idempotency
    event_hash: text("event_hash").notNull(),

    // Event type e.g. BOOKING_CONFIRMED, REPORT_READY, etc.
    event_type: text("event_type").notNull(),

    // Booking id referenced by the event (if present)
    booking_id: text("booking_id"),

    // Raw JSON payload and headers
    payload: text("payload").notNull(),
    headers: text("headers").notNull(),

    // Signature header value (if provided)
    signature: text("signature"),

    processed: integer("processed").notNull().default(0),
    received_at: text("received_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    processed_at: text("processed_at"),
  },
  (table) => ({
    // Ensure no duplicate processing of the same event payload
    unique_event_hash: uniqueIndex("uniq_healthians_event_hash").on(table.event_hash),
  })
);