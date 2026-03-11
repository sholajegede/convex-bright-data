import type { GenericActionCtx, GenericDataModel } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

export type BrightDataSyncOptions = {
  /** Your Bright Data API token */
  BRIGHTDATA_API_TOKEN: string;
  /** Bright Data SERP zone name (default: "serp_api1") */
  BRIGHTDATA_SEARCH_ZONE?: string;
  /** Bright Data Web Unlocker zone name (default: "web_unlocker1") */
  BRIGHTDATA_WEB_UNLOCKER_ZONE?: string;
  /** Default TTL for search results in ms (default: 1 hour) */
  DEFAULT_SEARCH_TTL_MS?: number;
  /** Default TTL for scraped pages in ms (default: 6 hours) */
  DEFAULT_PAGE_TTL_MS?: number;
};

export type SearchArgs = {
  query: string;
  vertical?: string;
  recency?: string;
  ttlMs?: number;
};

export type ScrapeArgs = {
  url: string;
  ttlMs?: number;
};

/**
 * Client wrapper for the BrightDataSync Convex component.
 *
 * @example
 * ```ts
 * // convex/brightData.ts
 * import { components } from "./_generated/api.js";
 * import { BrightDataSync } from "@sholajegede/bright-data-sync";
 *
 * export const brightData = new BrightDataSync(components.brightDataSync, {
 *   BRIGHTDATA_API_TOKEN: process.env.BRIGHTDATA_API_TOKEN!,
 * });
 *
 * // In an action:
 * export const mySearch = action({
 *   args: { q: v.string() },
 *   handler: async (ctx, args) => {
 *     return await brightData.search(ctx, { query: args.q });
 *   },
 * });
 * ```
 */
export class BrightDataSync {
  constructor(
    public component: ComponentApi,
    private options: BrightDataSyncOptions,
  ) {}

  /**
   * Search via Bright Data SERP API. Returns cached results if fresh.
   */
  async search(ctx: ActionCtx, args: SearchArgs) {
    return ctx.runAction(this.component.lib.search, {
      query: args.query,
      vertical: args.vertical,
      recency: args.recency,
      ttlMs: args.ttlMs ?? this.options.DEFAULT_SEARCH_TTL_MS,
      brightdataApiToken: this.options.BRIGHTDATA_API_TOKEN,
      brightdataSearchZone: this.options.BRIGHTDATA_SEARCH_ZONE,
    });
  }

  /**
   * Scrape a URL via Bright Data Web Unlocker. Returns cached content if fresh.
   */
  async scrape(ctx: ActionCtx, args: ScrapeArgs) {
    return ctx.runAction(this.component.lib.scrape, {
      url: args.url,
      ttlMs: args.ttlMs ?? this.options.DEFAULT_PAGE_TTL_MS,
      brightdataApiToken: this.options.BRIGHTDATA_API_TOKEN,
      brightdataWebUnlockerZone: this.options.BRIGHTDATA_WEB_UNLOCKER_ZONE,
    });
  }

  /**
   * Invalidate cached search results or page content.
   */
  async invalidate(
    ctx: ActionCtx,
    args: { query?: string; url?: string },
  ) {
    return ctx.runAction(this.component.lib.invalidate, args);
  }
}

// Re-export the component API type for convenience
export type { ComponentApi };

type ActionCtx = Pick<
  GenericActionCtx<GenericDataModel>,
  "runQuery" | "runMutation" | "runAction"
>;