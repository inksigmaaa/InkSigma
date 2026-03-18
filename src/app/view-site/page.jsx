import { headers } from "next/headers";
import ViewSitePageClient from "./ViewSitePageClient";
import {
  buildPublicationMetadata,
  fetchPublicationForMetadata,
} from "@/utils/publicationSeo";

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "";

  const publication = await fetchPublicationForMetadata({
    host,
    searchParams: resolvedSearchParams,
  });

  return buildPublicationMetadata({
    publication,
    pathname: "/",
    title: publication?.name,
    description: publication?.description,
    image: publication?.metaOgImageUrl || publication?.logoUrl,
    type: "website",
  });
}

export default function ViewSitePage() {
  return <ViewSitePageClient />;
}
