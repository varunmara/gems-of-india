import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

/* 

1. Enable uuidv7 extension
2. Enable pgcrypto extension
3. Enable pg_stat_statements extension
4. Enable pg_stat_kcache extension
5. Enable pg_stat_activity extension
6. Enable pg_stat_bgwriter extension
7. Enable pg_stat_user_tables extension
8. Enable pg_stat_user_indexes extension
*/

// Entity status enum
export const entityStatus = {
  PENDING: "pending",
  PUBLISHED: "published",
  REJECTED: "rejected",
  IN_REVIEW: "in_review",
} as const

export type EntityStatus = (typeof entityStatus)[keyof typeof entityStatus]

export const entityType = {
  PERSON: "person",
  DEPARTMENT: "department",
  ORGANIZATION: "organization",
  INFRASTRUCTURE: "infrastructure",
} as const

export type EntityType = (typeof entityType)[keyof typeof entityType]

export const user = pgTable("user", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
})

export const session = pgTable("session", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
})

export const account = pgTable("account", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
})

export const verification = pgTable("verification", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
})

export const seoArticle = pgTable(
  "seo_article",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(), // Content MDX complete
    image: text("image"), // Main image URL
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    publishedAt: timestamp("published_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      slugIdx: index("seo_article_slug_idx").on(table.slug),
    }
  },
)

export const blogArticle = pgTable(
  "blog_article",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    content: text("content").notNull(),
    image: text("image"),
    tags: text("tags").array(),
    author: text("author").notNull().default("Gems of India"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    publishedAt: timestamp("published_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      slugIdx: index("blog_article_slug_idx").on(table.slug),
      publishedAtIdx: index("blog_article_published_at_idx").on(table.publishedAt),
    }
  },
)

export const category = pgTable(
  "category",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      nameIdx: index("category_name_idx").on(table.name),
    }
  },
)

// Junction table for many-to-many relationship between entities and categories
export const entityToCategory = pgTable(
  "entity_to_category",
  {
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entity.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey(table.entityId, table.categoryId),
    }
  },
)

// Interactions
export const upvote = pgTable(
  "upvote",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entity.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Performance indexes for upvote queries
    userIdIdx: index("upvote_user_id_idx").on(table.userId),
    entityIdIdx: index("upvote_entity_id_idx").on(table.entityId),
    createdAtIdx: index("upvote_created_at_idx").on(table.createdAt),
    // Composite index for user-entity lookups
    userEntityIdx: index("upvote_user_entity_idx").on(table.userId, table.entityId),
  }),
)

// Tables for Fuma Comment
export const fumaRoles = pgTable("fuma_roles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  canDelete: boolean("can_delete").notNull(),
})

export const fumaComments = pgTable("fuma_comments", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  page: varchar("page", { length: 256 }).notNull(),
  thread: integer("thread"),
  author: varchar("author", { length: 256 }).notNull(),
  content: jsonb("content").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
})

export const fumaRates = pgTable(
  "fuma_rates",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => fumaComments.id, { onDelete: "cascade" }),
    like: boolean("like").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.commentId] }),
    index("comment_idx").on(table.commentId),
  ],
)

// All people, organizations, departments, courts, etc.
export const entity = pgTable(
  "entity",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    description: text("description"),
    keywords: text("keywords").array(),
    streetAddress: text("street_address"),
    city: text("city"),
    state: text("state"),
    zipCode: text("zip_code"),
    phoneNumber: text("phone_number"),
    email: text("email"),
    entityType: text("entity_type").notNull(), // Person, Org, Department, Faculty, Court, etc.
    slug: text("slug").notNull().unique(),
    status: text("status").notNull().default(entityStatus.PENDING),
    netWorth: text("net_worth"),
    websiteUrl: text("website_url"),
    logoUrl: text("logo_url"),
    imageUrl: text("image_url"),
    facebookUrl: text("facebook_url"),
    twitterUrl: text("twitter_url"),
    featuredOnHomepage: boolean("featured_on_homepage").default(false),
    dailyRanking: integer("daily_ranking"),
    createdAt: timestamp("created_at").defaultNow(),
    createdBy: uuid("created_by").references(() => user.id),
    updatedAt: timestamp("updated_at").defaultNow(),
    updatedBy: uuid("updated_by").references(() => user.id),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: uuid("verified_by").references(() => user.id),
  },
  (table) => ({
    // Performance indexes for home page queries
    statusIdx: index("entity_status_idx").on(table.status),
    createdAtIdx: index("entity_created_at_idx").on(table.createdAt),
    dailyRankingIdx: index("entity_daily_ranking_idx").on(table.dailyRanking),
    featuredIdx: index("entity_featured_idx").on(table.featuredOnHomepage),
    // Composite indexes for common query patterns
    statusCreatedIdx: index("entity_status_created_idx").on(table.status, table.createdAt),
    statusRankingIdx: index("entity_status_ranking_idx").on(table.status, table.dailyRanking),
    // Directory page filtering indexes
    entityTypeIdx: index("entity_type_idx").on(table.entityType),
    stateIdx: index("entity_state_idx").on(table.state),
    cityIdx: index("entity_city_idx").on(table.city),
    nameIdx: index("entity_name_idx").on(table.name),
    // Composite indexes for directory page filter combinations
    statusEntityTypeIdx: index("entity_status_type_idx").on(table.status, table.entityType),
    statusStateIdx: index("entity_status_state_idx").on(table.status, table.state),
    statusCityIdx: index("entity_status_city_idx").on(table.status, table.city),
    stateCityIdx: index("entity_state_city_idx").on(table.state, table.city),
  }),
)

// Relationships between entities (graph structure)
export const entityRelationship = pgTable(
  "entity_relationship",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    parentEntityId: uuid("parent_entity_id").references(() => entity.id, {
      onDelete: "cascade",
    }),
    childEntityId: uuid("child_entity_id").references(() => entity.id, {
      onDelete: "cascade",
    }),
    relationshipType: text("relationship_type").notNull(), // sub_org_of, member_of, reports_to
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").defaultNow(),
    createdBy: uuid("created_by").references(() => user.id),
    updatedAt: timestamp("updated_at").defaultNow(),
    updatedBy: uuid("updated_by").references(() => user.id),
  },
  (table) => {
    return {
      uniqueRelationship: index("unique_entity_relationship").on(
        table.parentEntityId,
        table.childEntityId,
        table.relationshipType,
      ),
    }
  },
)

// A person's position in an organization over time
export const roleAssignment = pgTable(
  "role_assignment",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    personId: uuid("person_id").references(() => entity.id, {
      onDelete: "cascade",
    }), // must be entity_type='Person'
    orgId: uuid("org_id").references(() => entity.id, {
      onDelete: "cascade",
    }), // can be Department, Org, etc.
    title: text("title").notNull(),
    responsibilities: text("responsibilities"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    metadata: jsonb("metadata"), // salary grade, rank, political affiliation, etc.
    createdAt: timestamp("created_at").defaultNow(),
    createdBy: uuid("created_by").references(() => user.id),
    updatedAt: timestamp("updated_at").defaultNow(),
    updatedBy: uuid("updated_by").references(() => user.id),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: uuid("verified_by").references(() => user.id),
  },
  (table) => {
    return {
      uniqueRole: index("unique_role_assignment").on(
        table.personId,
        table.orgId,
        table.title,
        table.startDate,
      ),
    }
  },
)

// Reviews table
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    entityId: uuid("entity_id")
      .references(() => entity.id, { onDelete: "cascade" })
      .notNull(),
    rating: integer("rating").notNull(), // 1-5 stars
    title: text("title").notNull(),
    content: text("content").notNull(),
    helpful: integer("helpful").default(0),
    notHelpful: integer("not_helpful").default(0),
    verified: boolean("verified").default(false), // Verified review
    edited: boolean("edited").default(false),
    overallSatisfaction: integer("overall_satisfaction"), // 1-10 scale
    recommendToOthers: boolean("recommend_to_others"), // Would you recommend this entity?
    hasEvidence: boolean("has_evidence").default(false), // Claims backed by evidence
    isAnonymous: boolean("is_anonymous").default(false), // Anonymous review
    experienceDate: timestamp("experience_date"), // When did this interaction happen
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Indexes for better query performance
    userIdIdx: index("reviews_user_id_idx").on(table.userId),
    entityIdIdx: index("reviews_entity_id_idx").on(table.entityId),
    ratingIdx: index("reviews_rating_idx").on(table.rating),
    createdAtIdx: index("reviews_created_at_idx").on(table.createdAt),
    // Composite index for government department and infrastructure reviews sorted by date
    entityCreatedIdx: index("reviews_entity_created_idx").on(table.entityId, table.createdAt),
  }),
)

// Review helpfulness votes
export const reviewVotes = pgTable(
  "review_votes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    reviewId: uuid("review_id")
      .references(() => reviews.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    voteType: text("vote_type", { enum: ["helpful", "not_helpful"] }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // Ensure one vote per user per review
    userReviewIdx: index("review_votes_user_review_idx").on(table.userId, table.reviewId),
  }),
)

// Review attributes definition table
export const reviewAttribute = pgTable(
  "review_attribute",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    entityType: text("entity_type").notNull(), // person, department, organization, infrastructure
    name: text("name").notNull(), // "transparency", "corruption_level", "responsiveness"
    label: text("label").notNull(), // "Transparency Level", "Reports of Corruption", "Response Time"
    description: text("description"), // Help text for users
    attributeType: text("attribute_type").notNull(), // "boolean", "scale", "percentage", "tags"
    category: text("category").notNull(), // "integrity", "service_delivery", "accessibility"
    displayOrder: integer("display_order").notNull().default(0),
    isRequired: boolean("is_required").default(false),
    isActive: boolean("is_active").default(true),
    metadata: jsonb("metadata"), // scale ranges, options, etc.
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    entityTypeIdx: index("review_attribute_entity_type_idx").on(table.entityType),
    categoryIdx: index("review_attribute_category_idx").on(table.category),
  }),
)

// User responses to custom attributes
export const reviewAttributeResponse = pgTable(
  "review_attribute_response",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    attributeId: uuid("attribute_id")
      .notNull()
      .references(() => reviewAttribute.id, { onDelete: "cascade" }),
    value: jsonb("value").notNull(), // flexible storage: boolean, number, array of strings
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    reviewAttributeIdx: index("review_attribute_response_review_attribute_idx").on(
      table.reviewId,
      table.attributeId,
    ),
    attributeIdx: index("review_attribute_response_attribute_idx").on(table.attributeId),
  }),
)

// Predefined tags for positive/negative aspects
export const reviewTag = pgTable(
  "review_tag",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    entityType: text("entity_type").notNull(),
    name: text("name").notNull(), // "accessible", "responsive", "long_wait_times"
    label: text("label").notNull(), // "Accessible", "Responsive", "Long Wait Times"
    tagType: text("tag_type").notNull(), // "positive", "concern"
    category: text("category"), // "service_delivery", "accessibility"
    color: text("color").default("#10b981"), // For UI display
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    entityTypeTagTypeIdx: index("review_tag_entity_type_tag_type_idx").on(
      table.entityType,
      table.tagType,
    ),
  }),
)

// User-selected tags for their review
export const reviewTagSelection = pgTable(
  "review_tag_selection",
  {
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => reviewTag.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey(table.reviewId, table.tagId),
    reviewIdx: index("review_tag_selection_review_idx").on(table.reviewId),
    tagIdx: index("review_tag_selection_tag_idx").on(table.tagId),
  }),
)

// Types for TypeScript
export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert
export type Entity = typeof entity.$inferSelect
export type NewEntity = typeof entity.$inferInsert
export type Review = typeof reviews.$inferSelect
export type NewReview = typeof reviews.$inferInsert
export type ReviewVote = typeof reviewVotes.$inferSelect
export type NewReviewVote = typeof reviewVotes.$inferInsert
export type ReviewAttribute = typeof reviewAttribute.$inferSelect
export type NewReviewAttribute = typeof reviewAttribute.$inferInsert
export type ReviewAttributeResponse = typeof reviewAttributeResponse.$inferSelect
export type NewReviewAttributeResponse = typeof reviewAttributeResponse.$inferInsert
export type ReviewTag = typeof reviewTag.$inferSelect
export type NewReviewTag = typeof reviewTag.$inferInsert
export type ReviewTagSelection = typeof reviewTagSelection.$inferSelect
export type NewReviewTagSelection = typeof reviewTagSelection.$inferInsert
export type RoleAssignment = typeof roleAssignment.$inferSelect
export type NewRoleAssignment = typeof roleAssignment.$inferInsert

// Extended types for API responses
export type ReviewWithUser = Review & {
  user: {
    id: string
    name: string
    avatar: string | null
    verified: boolean
  }
  userVote?: "helpful" | "not_helpful" | null
}

// Extended review type with attributes and tags
export type ReviewWithAttributes = Review & {
  user: {
    id: string
    name: string
    image: string | null
  }
  attributeResponses: (ReviewAttributeResponse & {
    attribute: ReviewAttribute
  })[]
  tags: (ReviewTagSelection & {
    tag: ReviewTag
  })[]
  userVote?: "helpful" | "not_helpful" | null
}

export type EntityWithReviews = Entity & {
  reviews: ReviewWithUser[]
  avgRating: number
  totalReviews: number
  ratingDistribution: {
    rating: number
    count: number
    percentage: number
  }[]
}
