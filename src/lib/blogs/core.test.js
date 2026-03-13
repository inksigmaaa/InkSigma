import { expect, test } from "vitest";

import { BLOG_STATUSES, resolveBlogState, slugifyTitle } from "./core.js";

test("slugifyTitle normalizes punctuation and whitespace", () => {
    expect(slugifyTitle("  Hello, World! From InkSigma  ")).toBe("hello-world-from-inksigma");
});

test("slugifyTitle falls back when input has no slug-safe characters", () => {
    expect(slugifyTitle("!!!")).toBe("untitled");
});

test("resolveBlogState returns published state for publish action", () => {
    const state = resolveBlogState("publish");

    expect(state.status).toBe(BLOG_STATUSES.PUBLISHED);
    expect(state.published).toBe(true);
    expect(state.scheduledFor).toBeNull();
    expect(state.publishedAt).toBeInstanceOf(Date);
});

test("resolveBlogState returns scheduled state for a valid schedule", () => {
    const state = resolveBlogState("schedule", "2026-05-02T14:30:00.000Z");

    expect(state.status).toBe(BLOG_STATUSES.SCHEDULED);
    expect(state.published).toBe(false);
    expect(state.publishedAt).toBeNull();
    expect(state.scheduledFor).toBeInstanceOf(Date);
    expect(state.scheduledFor.toISOString()).toBe("2026-05-02T14:30:00.000Z");
});

test("resolveBlogState rejects invalid schedules", () => {
    expect(() => resolveBlogState("schedule", "not-a-date")).toThrow("A valid schedule time is required");
});
