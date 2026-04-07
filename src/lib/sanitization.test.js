import { expect, test } from "vitest";

import { sanitizePlainText, sanitizeRichText } from "./sanitization.js";

test("sanitizeRichText strips executable markup and unsafe protocols", () => {
    const sanitized = sanitizeRichText(
        `<p onclick="alert(1)">Safe</p><script>alert(1)</script><a href="javascript:alert(1)">Bad</a><a href="https://example.com">Good</a>`,
    );

    expect(sanitized).toMatch(/<p>Safe<\/p>/);
    expect(sanitized).not.toMatch(/<script/i);
    expect(sanitized).not.toMatch(/onclick/i);
    expect(sanitized).not.toMatch(/javascript:/i);
    expect(sanitized).toMatch(/href="https:\/\/example.com"/);
});

test("sanitizePlainText removes all tags", () => {
    expect(sanitizePlainText("<b>Hello</b> <script>alert(1)</script>")).toBe("Hello");
});
