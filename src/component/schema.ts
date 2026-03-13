import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  searches: defineTable({
    query: v.string(),
    vertical: v.optional(v.string()), // "web" | "news" | "shopping" etc.
    recency: v.optional(v.string()),  // "d" | "w" | "m" etc.
    results: v.string(),              // JSON-stringified array of results
    fetchedAt: v.number(),            // Date.now()
    expiresAt: v.number(),            // fetchedAt + TTL
  })
    .index("by_query", ["query"])
    .index("by_expires", ["expiresAt"]),

  pages: defineTable({
    url: v.string(),
    content: v.string(),   // markdown from Web Unlocker
    fetchedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_url", ["url"])
    .index("by_expires", ["expiresAt"]),
});