import { expect, test } from "vitest";

import { parseBlogWritePayload } from "./blogs.js";
import { parseCommentPayload } from "./comments.js";
import { parsePublicationCreatePayload } from "./publication.js";

test("parseBlogWritePayload accepts valid blog input and preserves defaults", () => {
    const payload = parseBlogWritePayload({
        content: "<p>Body</p>",
        description: "Summary",
        title: "Example Post",
    });

    expect(payload.action).toBe("draft");
    expect(payload.categories).toEqual([]);
    expect(payload.image).toBeNull();
    expect(payload.scheduledFor).toBeNull();
});

test("parseBlogWritePayload rejects invalid scheduling payloads", () => {
    expect(() =>
            parseBlogWritePayload({
                action: "schedule",
                content: "<p>Body</p>",
                description: "Summary",
                scheduledFor: "tomorrow",
                title: "Example Post",
            }),
    ).toThrow(/Invalid ISO datetime/);
});

test("parsePublicationCreatePayload normalizes and validates the subdomain", () => {
    const payload = parsePublicationCreatePayload({
        name: "InkSigma",
        subdomain: "Elite-News",
    });

    expect(payload.subdomain).toBe("elite-news");
    expect(payload.image).toBeNull();
});

test("parsePublicationCreatePayload rejects malformed subdomains", () => {
    expect(() =>
            parsePublicationCreatePayload({
                name: "InkSigma",
                subdomain: "bad_domain",
            }),
    ).toThrow(/Invalid string/);
});

test("parseCommentPayload defaults parentId to null", () => {
    const payload = parseCommentPayload({
        blogId: 42,
        content: "First comment",
    });

    expect(payload.parentId).toBeNull();
});

test("parseCommentPayload rejects empty comments", () => {
    expect(() =>
            parseCommentPayload({
                blogId: 42,
                content: "   ",
            }),
    ).toThrow(/Too small/);
});
