import { action, query } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { BrightDataSync } from "../../src/client/index.js";
import { v } from "convex/values";

// Instantiate the component client — env vars are fine here (app code, not component)
const brightData = new BrightDataSync(components.brightDataSync, {
  BRIGHTDATA_API_TOKEN: process.env.BRIGHTDATA_API_TOKEN!,
  BRIGHTDATA_SEARCH_ZONE: process.env.BRIGHTDATA_SEARCH_ZONE,
  BRIGHTDATA_WEB_UNLOCKER_ZONE: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE,
});

/**
 * Search the web via Bright Data SERP API.
 * Results are cached in Convex and returned reactively.
 */
export const searchWeb = action({
  args: {
    query: v.string(),
    vertical: v.optional(v.string()),
    recency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await brightData.search(ctx, args);
  },
});

/**
 * Scrape a page via Bright Data Web Unlocker.
 * Content is cached in Convex and returned reactively.
 */
export const scrapePage = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await brightData.scrape(ctx, args);
  },
});

/**
 * Reactive query — get cached search results for a query.
 * Returns null if not yet fetched, or stale data with isFresh: false.
 */
export const getCachedSearch = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.brightDataSync.lib.getSearch, {
      query: args.query,
    });
  },
});

/**
 * Reactive query — get cached page content for a URL.
 */
export const getCachedPage = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.brightDataSync.lib.getPage, {
      url: args.url,
    });
  },
});

/**
 * Force-invalidate cached data so next call re-fetches from Bright Data.
 */
export const invalidateCache = action({
  args: {
    query: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await brightData.invalidate(ctx, args);
  },
});