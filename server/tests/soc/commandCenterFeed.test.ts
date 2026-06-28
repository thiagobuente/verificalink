import { describe, expect, it } from "vitest";
import { buildSOCOperationalView } from "../../command-center/socOperationalAggregator";

describe("SOC command center feed", () => {
  it("includes provider status and SOC summary fields", () => {
    const feed = buildSOCOperationalView("test-command-center");

    expect(Array.isArray(feed.providerStatus)).toBe(true);
    expect(typeof feed.aggregateScore).toBe("number");
    expect(Array.isArray(feed.correlatedIocs)).toBe(true);
    expect(Array.isArray(feed.recentEvents)).toBe(true);
  });
});
