import { describe, expect, it } from "vitest";

import {
  parseScreenshotAutomationConfig,
  screenshotTargetHref,
} from "./screenshot-automation-config";

describe("screenshot automation config", () => {
  it("accepts allowlisted targets and explicit themes", () => {
    expect(parseScreenshotAutomationConfig({ target: "home", theme: "light" })).toEqual({
      target: "home",
      theme: "light",
    });
    expect(parseScreenshotAutomationConfig({ target: ["people"], theme: ["dark"] })).toEqual({
      target: "people",
      theme: "dark",
    });
    expect(parseScreenshotAutomationConfig({ target: "debt-detail", theme: "light" })).toEqual({
      target: "debt-detail",
      theme: "light",
    });
  });

  it("rejects missing, automatic, and unknown values", () => {
    expect(parseScreenshotAutomationConfig({})).toBeNull();
    expect(parseScreenshotAutomationConfig({ target: "home", theme: "auto" })).toBeNull();
    expect(parseScreenshotAutomationConfig({ target: "unknown", theme: "light" })).toBeNull();
  });

  it("maps targets to stable application routes", () => {
    expect(screenshotTargetHref("home")).toBe("/home");
    expect(screenshotTargetHref("debts")).toBe("/debts");
    expect(screenshotTargetHref("people")).toBe("/people");
    expect(screenshotTargetHref("reminders")).toBe("/notifications");
    expect(screenshotTargetHref("activity")).toBe("/activity");
    expect(screenshotTargetHref("settings")).toBe("/settings?screenshotMode=store");
  });

  it("requires seeded fixture resolution for detail targets", () => {
    expect(() => screenshotTargetHref("debt-detail")).toThrow(/seeded screenshot fixture/);
    expect(() => screenshotTargetHref("person-detail")).toThrow(/seeded screenshot fixture/);
  });
});
