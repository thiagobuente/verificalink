import { describe, expect, it } from "vitest";
import { LocalProviderCache } from "../../providers/cache/localCache";

describe("LocalProviderCache", () => {
  it("expires entries by TTL", async () => {
    const cache = new LocalProviderCache<string>();
    cache.set("ioc", "value", 1);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(cache.get("ioc")).toBeNull();
  });

  it("enforces max entry limit", () => {
    const cache = new LocalProviderCache<number>(2);
    cache.set("a", 1, 1000);
    cache.set("b", 2, 1000);
    cache.set("c", 3, 1000);
    expect(cache.size()).toBe(2);
    expect(cache.get("c")).toBe(3);
  });
});
