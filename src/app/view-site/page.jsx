import { headers } from "next/headers";
import { cache } from "react";
import ViewSitePageClient from "./ViewSitePageClient";
import { buildPublicationMetadata } from "@/utils/publicationSeo";
import {
  normalizeSearchParamsRecord,
  resolvePublicSiteContext,
} from "@/utils/publicSiteContext";

const stringifySearchParams = (searchParams = {}) => {
  try {
    return JSON.stringify(searchParams || {});
  } catch {
    return "{}";
  }
};

const resolveViewSiteContextCached = cache(async (host, searchParamsKey) => {
  const parsedSearchParams = searchParamsKey ? JSON.parse(searchParamsKey) : {};
  return resolvePublicSiteContext({
    host,
    searchParams: parsedSearchParams,
  });
});

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const normalizedSearchParams = normalizeSearchParamsRecord(resolvedSearchParams);
  const searchParamsKey = stringifySearchParams(normalizedSearchParams);
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "";

  const { publication } = await resolveViewSiteContextCached(host, searchParamsKey);

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
  const normalizedSearchParams = normalizeSearchParamsRecord(resolvedSearchParams);
  const searchParamsKey = stringifySearchParams(normalizedSearchParams);
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "";
  const { publication, publicationId } = await resolveViewSiteContextCached(
    host,
    searchParamsKey,
  );

  return (
    <ViewSitePageClient
      initialPublication={publication}
      initialPublicationId={publicationId}
    />
  );
}
