import { describe, it, expect, vi, afterEach } from "vitest";
import { getCurrentMonthRange, getCurrentWeekRange } from "./date";

describe("date range helpers (timezone-safe)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("getCurrentMonthRange starts on the 1st in local time, not shifted a day by UTC conversion", () => {
    // Local midnight Aug 1 in a positive UTC offset (e.g. CEST, UTC+2) is
    // July 31 22:00 UTC — this regresses if the date is built via
    // toISOString() instead of local getters.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 6, 16, 0, 0)); // Aug 6 2026, local time
    const { from, to } = getCurrentMonthRange();
    expect(from).toBe("2026-08-01");
    expect(to).toBe("2026-08-06");
  });

  it("getCurrentWeekRange starts on Monday of the current week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 6, 16, 0, 0)); // Thursday Aug 6 2026
    const { from, to } = getCurrentWeekRange();
    expect(from).toBe("2026-08-03"); // Monday
    expect(to).toBe("2026-08-06");
  });

  it("getCurrentWeekRange treats Sunday as the last day of the previous week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 9, 10, 0, 0)); // Sunday Aug 9 2026
    const { from, to } = getCurrentWeekRange();
    expect(from).toBe("2026-08-03"); // still the same Monday
    expect(to).toBe("2026-08-09");
  });
});
