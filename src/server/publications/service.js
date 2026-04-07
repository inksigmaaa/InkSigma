import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { publication } from "@/db/schema";
import { getPublicationForUser, getSessionOrNull } from "@/server/auth/session";

export async function getPublicationBySubdomain(subdomain) {
    if (!subdomain) {
        return null;
    }

    const publications = await db
        .select()
        .from(publication)
        .where(eq(publication.subdomain, subdomain))
        .limit(1);

    return publications[0] ?? null;
}

export async function resolvePublicationPreview(subdomain) {
    if (subdomain) {
        return getPublicationBySubdomain(subdomain);
    }

    const session = await getSessionOrNull();

    if (!session) {
        return null;
    }

    return getPublicationForUser(session.user.id);
}
