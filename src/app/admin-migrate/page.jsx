import { redirect } from "next/navigation";

import AdminMigrateClient from "./AdminMigrateClient";
import { getSessionOrNull, isAdminSession } from "@/server/auth/session";

export default async function AdminMigratePage() {
    const session = await getSessionOrNull();

    if (!session) {
        redirect("/login?redirect=/admin-migrate");
    }

    if (!isAdminSession(session)) {
        redirect("/home");
    }

    return <AdminMigrateClient />;
}
