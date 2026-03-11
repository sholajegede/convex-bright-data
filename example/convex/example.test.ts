import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initConvexTest } from "./setup.test";
import { api } from "./_generated/api";

describe("bright-data-sync example", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
  });
  afterEach(async () => {
    vi.useRealTimers();
  });

  test("getCachedSearch returns null when nothing cached", async () => {
    const t = initConvexTest();
    const result = await t.query(api.example.getCachedSearch, {
      query: "convex database",
    });
    expect(result).toBeNull();
  });

  test("getCachedPage returns null when nothing cached", async () => {
    const t = initConvexTest();
    const result = await t.query(api.example.getCachedPage, {
      url: "https://convex.dev",
    });
    expect(result).toBeNull();
  });
});