import sanitizeHtml from "sanitize-html";

const htmlConfig = {
    allowedAttributes: {
        a: ["href", "name", "target", "rel"],
        code: ["class"],
        div: ["style"],
        h1: ["style"],
        h2: ["style"],
        h3: ["style"],
        h4: ["style"],
        h5: ["style"],
        h6: ["style"],
        img: ["src", "alt", "title"],
        li: ["style"],
        ol: ["style"],
        p: ["style"],
        pre: ["class"],
        span: ["style"],
        ul: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
        img: ["http", "https", "data"],
    },
    allowedStyles: {
        "*": {
            color: [/^#[0-9a-f]+$/i, /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/],
            "font-family": [/^[a-z0-9\s,"'-]+$/i],
            "line-height": [/^\d+(\.\d+)?$/],
            "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        },
    },
    allowedTags: [
        "a",
        "b",
        "blockquote",
        "br",
        "code",
        "div",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "i",
        "img",
        "li",
        "ol",
        "p",
        "pre",
        "s",
        "span",
        "strong",
        "sub",
        "sup",
        "u",
        "ul",
    ],
    transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
            rel: "noopener noreferrer nofollow",
            target: "_blank",
        }),
    },
};

export function sanitizeRichText(value) {
    return sanitizeHtml(value ?? "", htmlConfig).trim();
}

export function sanitizePlainText(value) {
    return sanitizeHtml(value ?? "", {
        allowedAttributes: {},
        allowedTags: [],
    }).trim();
}
