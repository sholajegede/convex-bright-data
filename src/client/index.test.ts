import { describe, expect, test } from "vitest";
import { BrightDataSync } from "./index.js";
import { components } from "./setup.test.js";

describe("BrightDataSync client", () => {
  test("instantiates with required options", () => {
    const client = new BrightDataSync(components.brightDataSync, {
      BRIGHTDATA_API_TOKEN: "test-token",
    });
    expect(client).toBeDefined();
    expect(client.component).toBeDefined();
  });
});