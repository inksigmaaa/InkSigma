import "server-only";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/app/lib/auth";
import { getOptionalServerEnv } from "@/config/server-env";
import { db } from "@/db";
import { publication } from "@/db/schema";

export class AuthorizationError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "AuthorizationError";
        this.status = status;
    }
}

function parseCsvEnv(name) {
    const value = getOptionalServerEnv(name);

    if (!value) {
        return new Set();
    }

    return new Set(
        value
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
    );
}

export async function getSessionOrNull() {
    return auth.api.getSession({
        headers: await headers(),
    });
}

export async function requireSession() {
    const session = await getSessionOrNull();

    if (!session) {
        throw new AuthorizationError(401, "Unauthorized");
    }

    return session;
}

export async function getPublicationForUser(userId) {
    const userPublications = await db
        .select()
        .from(publication)
        .where(eq(publication.userId, userId))
        .limit(1);

    return userPublications[0] ?? null;
}

export async function requirePublicationOwner() {
    const session = await requireSession();
    const ownerPublication = await getPublicationForUser(session.user.id);

    if (!ownerPublication) {
        throw new AuthorizationError(404, "No publication found");
    }

    return {
        publication: ownerPublication,
        session,
    };
}

export function isAdminSession(session) {
    const adminEmails = parseCsvEnv("ADMIN_EMAILS");
    const adminUserIds = parseCsvEnv("ADMIN_USER_IDS");

    if (adminEmails.size === 0 && adminUserIds.size === 0) {
        return false;
    }

    return (
        adminUserIds.has(session.user.id) ||
        (session.user.email ? adminEmails.has(session.user.email) : false)
    );
}

export async function requireAdminSession() {
    const session = await requireSession();

    if (!isAdminSession(session)) {
        throw new AuthorizationError(403, "Forbidden");
    }

    return session;
}

export function authorizationErrorToResponse(error) {
    if (error instanceof AuthorizationError) {
        return Response.json({ error: error.message }, { status: error.status });
    }

    return null;
}
