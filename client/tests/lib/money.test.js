import { describe, expect, it } from "vitest";
import { formatNaira } from "@/lib/money";

describe("formatNaira", () => {
  it("converts kobo to naira and formats as NGN currency", () => {
    expect(formatNaira(500000)).toBe("₦5,000.00");
  });

  it("handles zero", () => {
    expect(formatNaira(0)).toBe("₦0.00");
  });

  it("treats null/undefined as zero", () => {
    expect(formatNaira(null)).toBe("₦0.00");
    expect(formatNaira(undefined)).toBe("₦0.00");
  });

  it("formats fractional naira amounts from odd kobo values", () => {
    expect(formatNaira(1050)).toBe("₦10.50");
  });
});
