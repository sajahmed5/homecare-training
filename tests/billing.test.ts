import { describe, it, expect } from "vitest";
import { tierFlags, priceIdForTier, tierForPriceId } from "../lib/billing";

describe("tierFlags", () => {
  it("core enables nothing", () => {
    expect(tierFlags("core")).toEqual({
      forms_enabled: false,
      recruitment_enabled: false,
    });
  });
  it("core_forms enables forms only", () => {
    expect(tierFlags("core_forms")).toEqual({
      forms_enabled: true,
      recruitment_enabled: false,
    });
  });
  it("core_recruitment enables recruitment only", () => {
    expect(tierFlags("core_recruitment")).toEqual({
      forms_enabled: false,
      recruitment_enabled: true,
    });
  });
  it("full enables both", () => {
    expect(tierFlags("full")).toEqual({
      forms_enabled: true,
      recruitment_enabled: true,
    });
  });
});

describe("price ↔ tier mapping", () => {
  it("round-trips through env", () => {
    process.env.STRIPE_PRICE_FULL = "price_full_test";
    process.env.STRIPE_PRICE_CORE = "price_core_test";
    expect(priceIdForTier("full")).toBe("price_full_test");
    expect(tierForPriceId("price_full_test")).toBe("full");
    expect(tierForPriceId("price_core_test")).toBe("core");
    expect(tierForPriceId("price_unknown")).toBeNull();
  });
});
