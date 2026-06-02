import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import BlogDetailPageClient from "./BlogDetailPageClient";
import {
  buildBlogPostingJsonLd,
  buildPublicationMetadata,
  fetchBlogForMetadata,
  serializeJsonLd,
} from "@/utils/publicationSeo";
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

const getBlogForMetadataCached = cache(async (host, slug, searchParamsKey) => {
  const parsedSearchParams = searchParamsKey ? JSON.parse(searchParamsKey) : {};
  return fetchBlogForMetadata({
    host,
    slug,
    searchParams: parsedSearchParams,
  });
});

const getPublicSiteContextCached = cache(async (host, searchParamsKey) => {
  const parsedSearchParams = searchParamsKey ? JSON.parse(searchParamsKey) : {};
  return resolvePublicSiteContext({
    host,
    searchParams: parsedSearchParams,
  });
});

const getCanonicalBlogPath = (invokePath, slug) => {
  const basePath = invokePath?.startsWith("/view-site") ? "/view-site" : "";
  return `${basePath}/blog/${encodeURIComponent(slug)}`;
};

export async function generateMetadata({ params, searchParams }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const normalizedSearchParams = normalizeSearchParamsRecord(resolvedSearchParams);
  const searchParamsKey = stringifySearchParams(normalizedSearchParams);
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "";

  const blog = await getBlogForMetadataCached(host, slug, searchParamsKey);

  if (!blog?.publicationId) {
    return {};
  }

  const { publication } = await getPublicSiteContextCached(host, searchParamsKey);

  return buildPublicationMetadata({
    publication,
    pathname: `/blog/${blog?.canonicalSlug || blog?.slug || slug}`,
    title: blog?.title,
    description: blog?.description,
    image: publication?.metaOgImageUrl || blog?.image || publication?.logoUrl,
    type: "article",
  });
}

export default async function BlogDetailPage({ params, searchParams }) {
  const resolvedParams = await Promise.resolve(params);
  const requestedSlug = resolvedParams?.slug;
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const normalizedSearchParams = normalizeSearchParamsRecord(resolvedSearchParams);
  const searchParamsKey = stringifySearchParams(normalizedSearchParams);
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "";
  const invokePath = headerList.get("x-invoke-path") || "";
  const [blog, { hostContext, publication }] = await Promise.all([
    getBlogForMetadataCached(host, requestedSlug, searchParamsKey),
    getPublicSiteContextCached(host, searchParamsKey),
  ]);

  if (
    blog?.shouldRedirect &&
    blog?.canonicalSlug &&
    blog.canonicalSlug !== requestedSlug
  ) {
    permanentRedirect(getCanonicalBlogPath(invokePath, blog.canonicalSlug));
  }

  // Return a real 404 for missing posts instead of a 200 "soft 404" (which
  // search engines can index as thin content).
  if (!blog?.publicationId) {
    notFound();
  }

  const canonicalSlug = blog.canonicalSlug || blog.slug || requestedSlug;
  const jsonLd = buildBlogPostingJsonLd({
    publication,
    blog,
    pathname: `/blog/${canonicalSlug}`,
  });

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
      <BlogDetailPageClient
        slug={requestedSlug}
        initialHostContext={hostContext}
        initialPublication={publication}
        initialBlog={blog}
      />
    </>
  );
}
