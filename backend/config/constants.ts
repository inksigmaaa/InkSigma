// config/constants.ts

export const BLOG_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
  UNPUBLISHED: "unpublished",
  TRASH: "trash",
  SCHEDULED: "scheduled",
  REVIEW: "review",
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
  AUTHOR: "author",
} as const;

export const DEFAULT_VALUES = {
  PAGINATION_LIMIT: 50,
  DRAFT_TITLE: "[Untitled]",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
