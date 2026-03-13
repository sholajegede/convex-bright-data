# @sholajegede/convex-bright-data

A [Convex component](https://www.convex.dev/components) that wraps [Bright Data's](https://brightdata.com) SERP API and Web Unlocker with reactive caching. Search results and scraped page content are stored in component-owned Convex tables with configurable TTLs — apps query cached results reactively, with no re-fetching if data is still fresh.

[![npm version](https://badge.fury.io/js/@sholajegede%2Fconvex-bright-data.svg)](https://badge.fury.io/js/@sholajegede%2Fconvex-bright-data)

Found a bug? Feature request? [File it here](https://github.com/sholajegede/convex-bright-data/issues).

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
npm install @sholajegede/convex-bright-data
```

Add the component to your `convex/convex.config.ts`:
```ts
import { defineApp } from "convex/server";
import brightData from "@sholajegede/convex-bright-data/convex.config.js";

const app = defineApp();
app.use(brightData);

export default app;
```

## Usage

Instantiate the client in your Convex functions file, passing your Bright Data credentials:
```ts
// convex/brightData.ts
import { components } from "./_generated/api.js";
import { BrightData } from "@sholajegede/convex-bright-data";

export const brightData = new BrightData(components.brightData, {
  BRIGHTDATA_API_TOKEN: process.env.BRIGHTDATA_API_TOKEN!,
  BRIGHTDATA_SEARCH_ZONE: process.env.BRIGHTDATA_SEARCH_ZONE,       // optional, default: "serp_api1"
  BRIGHTDATA_WEB_UNLOCKER_ZONE: process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE, // optional, default: "web_unlocker1"
  DEFAULT_SEARCH_TTL_MS: 1000 * 60 * 60,   // optional, default: 1 hour
  DEFAULT_PAGE_TTL_MS: 1000 * 60 * 60 * 6, // optional, default: 6 hours
});
```

> **Security note:** Your Bright Data API token is passed through Convex action arguments and traverses the Convex runtime on the server side. Always load it from environment variables using `process.env` in your app's Convex functions — never hardcode it or expose it in client-side code.
>
> ```sh
> npx convex env set BRIGHTDATA_API_TOKEN your_token_here
> ```

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

// Reactive query — subscribe to cached results from the frontend.
// This is the key pattern: call searchWeb once to fetch and cache,
// then useQuery on getCachedSearch to get live updates whenever the
// cache refreshes. No polling needed — Convex pushes updates automatically.
export const getCachedSearch = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.brightData.lib.getSearch, {
      query: args.query,
    });
  },
});
```
```tsx
// React component — subscribes reactively, re-renders when cache updates
const results = useQuery(api.myFunctions.getCachedSearch, { query: "convex database" });
// results.isFresh   — true if still within TTL, false if stale
// results.results   — JSON string of search results from Bright Data
// results.fetchedAt — timestamp of when data was last fetched
// results.expiresAt — timestamp of when the cache entry will expire
```

### Scrape a page
```ts
// Fetch (or return cached) page content
export const scrapePage = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await brightData.scrape(ctx, { url: args.url });
  },
});

// Reactive query — subscribe to cached page content from the frontend.
// Same pattern as search: scrape once, then useQuery for live updates.
export const getCachedPage = query({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.brightData.lib.getPage, {
      url: args.url,
    });
  },
});
```
```tsx
// React component
const page = useQuery(api.myFunctions.getCachedPage, { url: "https://example.com" });
// page.content    — raw HTML or text content of the scraped page
// page.isFresh    — true if still within TTL
// page.fetchedAt  — timestamp of last scrape
```

### Invalidate cache
```ts
// Force a fresh fetch on the next call by deleting the cached entry
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

## How reactive queries work

The component stores search results and scraped content in its own Convex tables. When you call `searchWeb` or `scrapePage`, the result is written to those tables. Any frontend component subscribed via `useQuery` on `getCachedSearch` or `getCachedPage` receives the update instantly — no polling, no websocket management, no extra infrastructure. This is standard Convex reactivity applied to external data.
```
User triggers searchWeb action
        ↓
Bright Data SERP API called
        ↓
Result stored in component-owned searches table
        ↓
All useQuery subscribers notified automatically
        ↓
UI updates in real time
```

## API

### `BrightData` class

| Method | Description |
|--------|-------------|
| `search(ctx, { query, vertical?, recency?, ttlMs? })` | Search via Bright Data SERP API. Returns cached results if fresh. |
| `scrape(ctx, { url, ttlMs? })` | Scrape a URL via Web Unlocker. Returns cached content if fresh. |
| `invalidate(ctx, { query?, url? })` | Delete cached entry to force re-fetch on next call. |

### Reactive queries (call via `ctx.runQuery`)

| Function | Description |
|----------|-------------|
| `components.brightData.lib.getSearch({ query })` | Get cached search result. Returns `null` if not yet fetched. |
| `components.brightData.lib.getPage({ url })` | Get cached page content. Returns `null` if not yet fetched. |

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