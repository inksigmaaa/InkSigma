import { notFound } from "next/navigation";

import ViewSiteClient from "./ViewSiteClient";

import { listPublishedBlogsForPublication } from "@/server/blogs/public";
import { resolvePublicationPreview } from "@/server/publications/service";

export default async function ViewSitePage({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const publication = await resolvePublicationPreview(resolvedSearchParams?.publication ?? null);

    if (!publication) {
        notFound();
    }

    const blogs = await listPublishedBlogsForPublication(publication.id);

    return <ViewSiteClient blogs={blogs} publication={publication} />;
}
