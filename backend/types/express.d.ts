import type { InferSelectModel } from "drizzle-orm";
import type { publication } from "../models/schema.js";

type PublicationRow = InferSelectModel<typeof publication>;

export type PublicationRole = "owner" | "admin" | "editor" | "author";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
}

export interface TenantContext {
  host: string;
  subdomain: string | null;
  customDomain: string | null;
  publication: PublicationRow | null;
  type: "root" | "dashboard" | "subdomain" | "custom-domain" | "unknown";
  isDashboard: boolean;
  isReservedSubdomain: boolean;
  isCustomDomain: boolean;
}

export interface PublicationAccessContext {
  publication: PublicationRow;
  isOwner: boolean;
  role: PublicationRole | null;
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: SessionUser;
      tenant?: TenantContext;
      publication?: PublicationRow;
      publicationAccess?: PublicationAccessContext;
      notificationId?: number;
      userRole?: PublicationRole;
    }
  }
}
