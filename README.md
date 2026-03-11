# @sholajegede/bright-data-sync

A [Convex component](https://www.convex.dev/components) that wraps [Bright Data's](https://brightdata.com) SERP API and Web Unlocker with reactive caching. Search results and scraped page content are stored in component-owned Convex tables with configurable TTLs — apps query cached results reactively, with no re-fetching if data is still fresh.

[![npm version](https://badge.fury.io/js/@sholajegede%2Fbright-data-sync.svg)](https://badge.fury.io/js/@sholajegede%2Fbright-data-sync)

Found a bug? Feature request? [File it here](https://github.com/sholajegede/bright-data-sync/issues).

<!-- START: Include on https://convex.dev/components -->

## Features

- **SERP search** via Bright Data's SERP API — Google search results cached in Convex
- **Web scraping** via Bright Data's Web Unlocker — page content cached in Convex
- **Reactive queries** — `useQuery` on cached results, live updates when cache refreshes
- **Configurable TTLs** — per-request or global defaults for searches and pages
- **Cache invalidation** — force re-fetch any query or URL on demand
- **No re-fetching** — returns cached data instantly if still within TTL

## Prerequisites

- A [Bright Data](https://brightdata.com) account with:
  - A SERP API zone (default zone name: `serp_api1`)
  - A Web Unlocker zone (default zone name: `web_unlocker1`)
  - An API token

## Installation
```sh
npm install @sholajegede/bright-data-sync
```

Add the component to your `convex/convex.config.ts`:
```ts
import { defineApp } from "convex/server";
import brightDataSync from "@sholajegede/bright-data-sync/convex.config.js";

const app = defineApp();
app.use(brightDataSync);

export default app;
```

## Usage

Instantiate the client in your Convex functions file, passing your Bright Data credentials:
```ts
// convex/brightData.ts
import { components } from "./_generated/api.js";
import { BrightDataSync } from "@sholajegede/bright-data-sync";

export const brightData = new BrightDataSync(components.brightDataSync, {
  BRIGHTDATA_API_TOKEN: process.env.BRIGHTDATA_API_TOKEN!,
  BRIGHTDATA_SEARCH_ZONE: process.env.BRIGHTDATA_SEARCH_ZONE,       // optional, default: "serp_api1"
  BRIGHTDATA_WEB_UNLOCKER_ZONE: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE, // optional, default: "web_unlocker1"
  DEFAULT_SEARCH_TTL_MS: 1000 * 60 * 60,   // optional, default: 1 hour
  DEFAULT_PAGE_TTL_MS: 1000 * 60 * 60 * 6, // optional, default: 6 hours
});
```

### Search the web
```ts
// convex/myFunctions.ts
import { action, query } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { brightData } from "./brightData.js";
import { v } from "convex/values";

// Fetch (or return cached) search results
export const searchWeb = action({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await brightData.search(ctx, { query: args.query });
  },
});

// Reactive query — subscribe to cached results from the frontend
export const getCachedSearch = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.brightDataSync.lib.getSearch, {
      query: args.query,
    });
  },
});
```
```tsx
// React component
const results = useQuery(api.myFunctions.getCachedSearch, { query: "convex database" });
// results.isFresh — true if within TTL
// results.results — JSON string of search results
// results.fetchedAt — timestamp of last fetch
```

### Scrape a page
```ts
export const scrapePage = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await brightData.scrape(ctx, { url: args.url });
  },
});

export const getCachedPage = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.brightDataSync.lib.getPage, {
      url: args.url,
    });
  },
});
```

### Invalidate cache
```ts
export const invalidateCache = action({
  args: {
    query: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await brightData.invalidate(ctx, args);
  },
});
```

## API

### `BrightDataSync` class

| Method | Description |
|--------|-------------|
| `search(ctx, { query, vertical?, recency?, ttlMs? })` | Search via Bright Data SERP API. Returns cached results if fresh. |
| `scrape(ctx, { url, ttlMs? })` | Scrape a URL via Web Unlocker. Returns cached content if fresh. |
| `invalidate(ctx, { query?, url? })` | Delete cached entry to force re-fetch on next call. |

### Reactive queries (call via `ctx.runQuery`)

| Function | Description |
|----------|-------------|
| `components.brightDataSync.lib.getSearch({ query })` | Get cached search result. Returns `null` if not yet fetched. |
| `components.brightDataSync.lib.getPage({ url })` | Get cached page content. Returns `null` if not yet fetched. |

Both return `{ results/content, fetchedAt, expiresAt, isFresh }`.

### `search` verticals

Pass a `vertical` string to search specific Google verticals:

| Value | Vertical |
|-------|----------|
| _(omit)_ | Web search |
| `nws` | News |
| `shop` | Shopping |
| `isch` | Images |
| `vid` | Videos |

### `search` recency

Pass a `recency` string to filter by date:

| Value | Range |
|-------|-------|
| `d` | Past day |
| `w` | Past week |
| `m` | Past month |
| `y` | Past year |

<!-- END: Include on https://convex.dev/components -->

## Example app

See [`example/`](./example) for a working Vite + React demo showing live SERP search and page scraping with reactive cache display.

## Development
```sh
npm i
npm run dev
```

## License

Apache-2.0