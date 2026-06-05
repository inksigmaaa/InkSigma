import { redirect } from "next/navigation";
import { normalizeSearchParamsRecord } from "@/utils/publicSiteContext";

// The public site's canonical home is the blog index (`/blog`). The bare tenant
// root ("/") and the legacy "/view-site" path both funnel here so there is a
// single indexable URL for the listing instead of duplicate content. The proxy
// rewrites tenant `/blog` -> `/view-site/blog`, which renders the listing.
const getParam = (params, key) => {
  const value = params?.[key];
  if (Array.isArray(value)) return value[0] || null;
  return typeof value === "string" && value.trim() ? value : null;
};

export default async function ViewSitePage({ searchParams }) {
  const resolved = normalizeSearchParamsRecord(await Promise.resolve(searchParams));
  const publicationId = getParam(resolved, "publicationId");

  redirect(
    publicationId
      ? `/blog?publicationId=${encodeURIComponent(publicationId)}`
      : "/blog",
  );
}
