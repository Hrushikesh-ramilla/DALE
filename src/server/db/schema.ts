import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const catalogProducts = pgTable(
  "catalog_products",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    price: integer("price").notNull(),
    record: jsonb("record").notNull(),
    publication: text("publication").notNull().default("unclassified"),
    releaseId: text("release_id"),
    leafType: text("leaf_type"),
    brand: text("brand"),
    modelName: text("model_name"),
    skuVariant: text("sku_variant"),
    revisionId: text("revision_id"),
  },
  (table) => [
    index("catalog_category_price").on(table.category, table.price, table.id),
    index("catalog_leaf_price").on(table.leafType, table.price, table.id),
    index("catalog_brand_model").on(table.brand, table.modelName),
  ],
);

export type CatalogProduct = InferSelectModel<typeof catalogProducts>;
export type NewCatalogProduct = InferInsertModel<typeof catalogProducts>;

export const catalogReleases = pgTable("catalog_releases", {
  id: text("id").primaryKey(),
  contentHash: text("content_hash").notNull(),
  status: text("status").notNull(),
  manifest: jsonb("manifest").notNull(),
  reviewedBy: text("reviewed_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export type CatalogRelease = InferSelectModel<typeof catalogReleases>;
export type NewCatalogRelease = InferInsertModel<typeof catalogReleases>;

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  state: jsonb("state").notNull(),
});

export const storefronts = pgTable("storefronts", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
});

export const customerAccounts = pgTable("customer_accounts", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CustomerAccount = InferSelectModel<typeof customerAccounts>;
export type NewCustomerAccount = InferInsertModel<typeof customerAccounts>;

export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("sessions_expiry").on(table.expiresAt)],
);

export type SessionRecord = InferSelectModel<typeof sessions>;
export type NewSessionRecord = InferInsertModel<typeof sessions>;

export const conciergeDocuments = pgTable("concierge_documents", {
  owner: text("owner").primaryKey(),
  state: jsonb("state").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ConciergeDocument = InferSelectModel<typeof conciergeDocuments>;

export const conciergeEmbeddings = pgTable("concierge_embeddings", {
  productId: text("product_id").primaryKey(),
  contentHash: text("content_hash").notNull(),
  model: text("model").notNull(),
  vector: jsonb("vector").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ConciergeEmbedding = InferSelectModel<typeof conciergeEmbeddings>;
