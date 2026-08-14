import { describe, expect, it } from "vitest";
import { mapCatalogueItems, type CatalogueItem, type RecommendationComponent } from "./use-opportunities";

const programme: CatalogueItem = {
  id: "11111111-1111-4111-8111-111111111111",
  entityType: "programme",
  title: "MSc Data Science",
  provider: "Example University",
  country_code: "GB",
  deadline_at: "2027-06-30T22:59:00Z",
  deadline_timezone: "Europe/London",
  tuition_amount: 31000,
  tuition_currency: "GBP",
  application_url: "https://example.edu/programme",
  last_verified_at: "2026-07-30T00:00:00Z",
  next_review_at: "2026-09-01T00:00:00Z",
};

describe("live catalogue mapping", () => {
  it("combines source facts, recommendation explanations and saved state", () => {
    const recommendation: RecommendationComponent = {
      entity_type: "programme",
      entity_id: programme.id,
      state: "conditional",
      final_score: 78,
      reasons: ["Subject background aligns"],
      open_checks: ["Upload mathematics module evidence"],
    };
    const [result] = mapCatalogueItems(
      [programme],
      [recommendation],
      [{ portfolio_items: [{ entity_type: "programme", entity_id: programme.id }] }],
      new Date("2026-08-03T00:00:00Z").getTime(),
    );

    expect(result).toMatchObject({
      id: programme.id,
      flag: "🇬🇧",
      deadlineAt: programme.deadline_at,
      match: "Conditional match",
      freshness: "Verified",
      condition: "Upload mathematics module evidence",
      saved: true,
      sourceUrl: programme.application_url,
    });
  });

  it("never presents an overdue source or unknown result as confirmed", () => {
    const [result] = mapCatalogueItems(
      [{ ...programme, last_verified_at: null, next_review_at: "2026-07-01T00:00:00Z" }],
      [],
      [],
      new Date("2026-08-03T00:00:00Z").getTime(),
    );

    expect(result.freshness).toBe("Review due");
    expect(result.match).toBe("Needs verification");
  });

  it("labels official records with incomplete facts as provisional", () => {
    const [result] = mapCatalogueItems(
      [{ ...programme, publish_tier: "provisional", attributes: { disclaimer: "Some details require verification from the official source." } }],
      [],
      [],
      new Date("2026-08-03T00:00:00Z").getTime(),
    );

    expect(result.freshness).toBe("Provisional");
    expect(result.publishTier).toBe("provisional");
    expect(result.disclaimer).toBe("Some details require verification from the official source.");
  });
});
