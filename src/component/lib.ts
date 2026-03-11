import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server.js";
import { internal } from "./_generated/api.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SEARCH_TTL_MS = 1000 * 60 * 60; // 1 hour
const DEFAULT_PAGE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

// ─── Internal helpers ────────────────────────────────────────────────────────

export const getSearchByQuery = internalQuery({
  args: { query: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("searches"),
      _creationTime: v.number(),
      query: v.string(),
      vertical: v.optional(v.string()),
      recency: v.optional(v.string()),
      results: v.string(),
      fetchedAt: v.number(),
      expiresAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("searches")
      .withIndex("by_query", (q) => q.eq("query", args.query))
      .first();
  },
});

export const getPageByUrl = internalQuery({
  args: { url: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("pages"),
      _creationTime: v.number(),
      url: v.string(),
      content: v.string(),
      fetchedAt: v.number(),
      expiresAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pages")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
  },
});

export const upsertSearch = internalMutation({
  args: {
    query: v.string(),
    vertical: v.optional(v.string()),
    recency: v.optional(v.string()),
    results: v.string(),
    ttlMs: v.optional(v.number()),
  },
  returns: v.id("searches"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (args.ttlMs ?? DEFAULT_SEARCH_TTL_MS);
    const existing = await ctx.db
      .query("searches")
      .withIndex("by_query", (q) => q.eq("query", args.query))
      .first();
    if (existing) {
      await ctx.db.patch("searches", existing._id, {
        results: args.results,
        fetchedAt: now,
        expiresAt,
        vertical: args.vertical,
        recency: args.recency,
      });
      return existing._id;
    }
    return await ctx.db.insert("searches", {
      query: args.query,
      vertical: args.vertical,
      recency: args.recency,
      results: args.results,
      fetchedAt: now,
      expiresAt,
    });
  },
});

export const upsertPage = internalMutation({
  args: {
    url: v.string(),
    content: v.string(),
    ttlMs: v.optional(v.number()),
  },
  returns: v.id("pages"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + (args.ttlMs ?? DEFAULT_PAGE_TTL_MS);
    const existing = await ctx.db
      .query("pages")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    if (existing) {
      await ctx.db.patch("pages", existing._id, {
        content: args.content,
        fetchedAt: now,
        expiresAt,
      });
      return existing._id;
    }
    return await ctx.db.insert("pages", {
      url: args.url,
      content: args.content,
      fetchedAt: now,
      expiresAt,
    });
  },
});

export const deleteSearchByQuery = internalMutation({
  args: { query: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("searches")
      .withIndex("by_query", (q) => q.eq("query", args.query))
      .first();
    if (existing) await ctx.db.delete("searches", existing._id);
    return null;
  },
});

export const deletePageByUrl = internalMutation({
  args: { url: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pages")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    if (existing) await ctx.db.delete("pages", existing._id);
    return null;
  },
});

// ─── Public queries (reactive) ───────────────────────────────────────────────

export const getSearch = query({
  args: { query: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      results: v.string(),
      fetchedAt: v.number(),
      expiresAt: v.number(),
      isFresh: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("searches")
      .withIndex("by_query", (q) => q.eq("query", args.query))
      .first();
    if (!row) return null;
    return {
      results: row.results,
      fetchedAt: row.fetchedAt,
      expiresAt: row.expiresAt,
      isFresh: Date.now() < row.expiresAt,
    };
  },
});

export const getPage = query({
  args: { url: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      content: v.string(),
      fetchedAt: v.number(),
      expiresAt: v.number(),
      isFresh: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("pages")
      .withIndex("by_url", (q) => q.eq("url", args.url))
      .first();
    if (!row) return null;
    return {
      content: row.content,
      fetchedAt: row.fetchedAt,
      expiresAt: row.expiresAt,
      isFresh: Date.now() < row.expiresAt,
    };
  },
});

// ─── Public actions ──────────────────────────────────────────────────────────

export const search = action({
  args: {
    query: v.string(),
    vertical: v.optional(v.string()),
    recency: v.optional(v.string()),
    ttlMs: v.optional(v.number()),
    // Passed in from client wrapper — never stored
    brightdataApiToken: v.string(),
    brightdataSearchZone: v.optional(v.string()),
  },
  returns: v.object({
    results: v.string(),
    fromCache: v.boolean(),
    fetchedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    // 1. Check cache
    // 1. Check cache
    const cached = (await ctx.runQuery(internal.lib.getSearchByQuery, {
      query: args.query,
    })) as {
      _id: string;
      results: string;
      fetchedAt: number;
      expiresAt: number;
      vertical?: string;
      recency?: string;
    } | null;
    if (cached && Date.now() < cached.expiresAt) {
      return {
        results: cached.results,
        fromCache: true,
        fetchedAt: cached.fetchedAt,
      };
    }

    // 2. Fetch from Bright Data SERP API
    const zone = args.brightdataSearchZone ?? "serp_api1";
    const url = new URL("https://api.brightdata.com/request");
    const body = {
      zone,
      url: `https://www.google.com/search?q=${encodeURIComponent(args.query)}${
        args.vertical ? `&tbm=${args.vertical}` : ""
      }${args.recency ? `&tbs=qdr:${args.recency}` : ""}`,
      format: "json",
    };

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.brightdataApiToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Bright Data SERP API error: ${
          response.status
        } ${await response.text()}`
      );
    }

    const results = await response.text();
    const now = Date.now();

    // 3. Store in cache
    await ctx.runMutation(internal.lib.upsertSearch, {
      query: args.query,
      vertical: args.vertical,
      recency: args.recency,
      results,
      ttlMs: args.ttlMs,
    });

    return { results, fromCache: false, fetchedAt: now };
  },
});

export const scrape = action({
  args: {
    url: v.string(),
    ttlMs: v.optional(v.number()),
    brightdataApiToken: v.string(),
    brightdataWebUnlockerZone: v.optional(v.string()),
  },
  returns: v.object({
    content: v.string(),
    fromCache: v.boolean(),
    fetchedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    // 1. Check cache
    const cached = (await ctx.runQuery(internal.lib.getPageByUrl, {
      url: args.url,
    })) as {
      _id: string;
      content: string;
      fetchedAt: number;
      expiresAt: number;
    } | null;
    if (cached && Date.now() < cached.expiresAt) {
      return {
        content: cached.content,
        fromCache: true,
        fetchedAt: cached.fetchedAt,
      };
    }

    // 2. Fetch from Bright Data Web Unlocker
    const zone = args.brightdataWebUnlockerZone ?? "web_unlocker1";
    const response = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.brightdataApiToken}`,
      },
      body: JSON.stringify({
        zone,
        url: args.url,
        format: "raw",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Bright Data Web Unlocker error: ${
          response.status
        } ${await response.text()}`
      );
    }

    const content = await response.text();
    const now = Date.now();

    // 3. Store in cache
    await ctx.runMutation(internal.lib.upsertPage, {
      url: args.url,
      content,
      ttlMs: args.ttlMs,
    });

    return { content, fromCache: false, fetchedAt: now };
  },
});

export const invalidate = action({
  args: {
    query: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.query) {
      await ctx.runMutation(internal.lib.deleteSearchByQuery, {
        query: args.query,
      });
    }
    if (args.url) {
      await ctx.runMutation(internal.lib.deletePageByUrl, { url: args.url });
    }
    return null;
  },
});