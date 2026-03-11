/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      getPage: FunctionReference<
        "query",
        "internal",
        { url: string },
        null | {
          content: string;
          expiresAt: number;
          fetchedAt: number;
          isFresh: boolean;
        },
        Name
      >;
      getSearch: FunctionReference<
        "query",
        "internal",
        { query: string },
        null | {
          expiresAt: number;
          fetchedAt: number;
          isFresh: boolean;
          results: string;
        },
        Name
      >;
      invalidate: FunctionReference<
        "action",
        "internal",
        { query?: string; url?: string },
        null,
        Name
      >;
      scrape: FunctionReference<
        "action",
        "internal",
        {
          brightdataApiToken: string;
          brightdataWebUnlockerZone?: string;
          ttlMs?: number;
          url: string;
        },
        { content: string; fetchedAt: number; fromCache: boolean },
        Name
      >;
      search: FunctionReference<
        "action",
        "internal",
        {
          brightdataApiToken: string;
          brightdataSearchZone?: string;
          query: string;
          recency?: string;
          ttlMs?: number;
          vertical?: string;
        },
        { fetchedAt: number; fromCache: boolean; results: string },
        Name
      >;
    };
  };
