export const BLOG_STATUSES = {
    DRAFT: "draft",
    PUBLISHED: "published",
    SCHEDULED: "scheduled",
    UNPUBLISHED: "unpublished",
    TRASH: "trash",
};

export const BLOG_STATUS_VALUES = Object.values(BLOG_STATUSES);

export function slugifyTitle(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "untitled";
}

function normalizeScheduledFor(scheduledFor) {
    if (!scheduledFor) {
        return null;
    }

    const parsed = new Date(scheduledFor);

    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

export function resolveBlogState(action, scheduledFor) {
    const normalizedScheduledFor = normalizeScheduledFor(scheduledFor);

    switch (action) {
        case "publish":
            return {
                published: true,
                publishedAt: new Date(),
                scheduledFor: null,
                status: BLOG_STATUSES.PUBLISHED,
            };
        case "schedule":
            if (!normalizedScheduledFor) {
                throw new Error("A valid schedule time is required");
            }

            return {
                published: false,
                publishedAt: null,
                scheduledFor: normalizedScheduledFor,
                status: BLOG_STATUSES.SCHEDULED,
            };
        case "unpublish":
            return {
                published: false,
                publishedAt: null,
                scheduledFor: null,
                status: BLOG_STATUSES.UNPUBLISHED,
            };
        case "trash":
            return {
                published: false,
                publishedAt: null,
                scheduledFor: null,
                status: BLOG_STATUSES.TRASH,
            };
        case "restore":
            return {
                published: false,
                publishedAt: null,
                scheduledFor: null,
                status: BLOG_STATUSES.DRAFT,
            };
        case "draft":
        default:
            return {
                published: false,
                publishedAt: null,
                scheduledFor: null,
                status: BLOG_STATUSES.DRAFT,
            };
    }
}
