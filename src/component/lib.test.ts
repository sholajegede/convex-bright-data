/// <reference types="vite/client" />
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api.js";
import { initConvexTest } from "./setup.test.js";

describe("component lib", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("getSearch returns null when nothing cached", async () => {
    const t = initConvexTest();
    const result = await t.query(api.lib.getSearch, { query: "test query" });
    expect(result).toBeNull();
  });

  test("getPage returns null when nothing cached", async () => {
    const t = initConvexTest();
    const result = await t.query(api.lib.getPage, { url: "https://example.com" });
    expect(result).toBeNull();
  });
});