import { headers } from "next/headers";
import ViewSitePageClient from "./ViewSitePageClient";
import { buildPublicationMetadata } from "@/utils/publicationSeo";
import { resolvePublicSiteContext } from "@/utils/publicSiteContext";

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "";

  const { publication } = await resolvePublicSiteContext({
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

export default async function ViewSitePage({ searchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "";
  const { publication, publicationId } = await resolvePublicSiteContext({
    host,
    searchParams: resolvedSearchParams,
  });

  return (
    <ViewSitePageClient
      initialPublication={publication}
      initialPublicationId={publicationId}
    />
  );
}
