-- RESTORED MARKETING TABLES
-- These tables are restored because other systems depend on them
-- The admin interfaces are removed but the data structures remain

-- Customer Segments - AI-generated customer groups for targeted campaigns
export const customerSegments = pgTable("customer_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  segmentType: text("segment_type").notNull(),
  targetCriteria: jsonb("target_criteria").notNull(),
  generatedByAI: boolean("generated_by_ai").notNull().default(false),
  aiPrompt: text("ai_prompt"),
  aiReasoning: text("ai_reasoning"),
  autoEntryEnabled: boolean("auto_entry_enabled").notNull().default(true),
  autoExitEnabled: boolean("auto_exit_enabled").notNull().default(true),
  status: text("status").notNull().default('active'),
  memberCount: integer("member_count").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0),
  totalJobsBooked: integer("total_jobs_booked").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastRefreshedAt: timestamp("last_refreshed_at"),
}, (table) => ({
  segmentTypeIdx: index("customer_segments_type_idx").on(table.segmentType),
  statusIdx: index("customer_segments_status_idx").on(table.status),
  generatedByAIIdx: index("customer_segments_ai_idx").on(table.generatedByAI),
}));