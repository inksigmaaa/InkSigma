export const PUBLICATION_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
} as const;

export const PUBLICATION_REVIEW_ROLES = [
  PUBLICATION_ROLES.ADMIN,
  PUBLICATION_ROLES.EDITOR,
] as const;

export const TENANT_TYPES = {
  SUBDOMAIN: "subdomain",
  CUSTOM_DOMAIN: "custom-domain",
} as const;

export const BLOG_IMAGE_UPLOAD_SEGMENT = "/uploads/blog-images/";
export const BLOG_IMAGE_UPLOAD_DIRECTORY = "uploads/blog-images";

export const DEFAULT_BLOG_PAGE_SIZE = 50;
export const MAX_BLOG_STATS_BATCH_SIZE = 50;

export const EMPTY_RICH_TEXT_HTML = "<p></p>";

export const REVIEW_ACTIONS = {
  ACCEPT: "accept",
  REJECT: "reject",
} as const;
