import { describe, expect, test } from "vitest";
import { BrightData } from "./index.js";
import { components } from "./setup.test.js";

describe("BrightData client", () => {
  test("instantiates with required options", () => {
    const client = new BrightData(components.brightData, {
      BRIGHTDATA_API_TOKEN: "test-token",
    });
    expect(client).toBeDefined();
    expect(client.component).toBeDefined();
  });
});