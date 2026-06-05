import { headers } from "next/headers";
import {
  buildSitemapXml,
  fetchPublicationForMetadata,
  fetchPublishedBlogsForSitemap,
  getRequestHost,
} from "@/utils/publicationSeo";
import { getPublicationPageUrl } from "@/utils/publicationDomain";
import { parseHost } from "@/utils/hostParser";

// Crawler endpoint — cache at the CDN. The response varies by Host (Vercel keys
// the edge cache by URL incl. host), and the data fetch already uses revalidate:30,
// so serve a fresh copy for 5 min and stale-while-revalidate for an hour instead
// of re-running resolve-host + a full blog fetch on every crawl.
const SITEMAP_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=3600";

export async function GET() {
  const headerList = await headers();
  const host = getRequestHost(headerList);
  const parsedHost = parseHost(host);

  if (parsedHost.isDashboard) {
    return new Response(buildSitemapXml([]), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": SITEMAP_CACHE_CONTROL,
      },
    });
  }

  const publication = await fetchPublicationForMetadata({ host });

  if (!publication?.id) {
    return new Response(buildSitemapXml([]), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": SITEMAP_CACHE_CONTROL,
      },
    });
  }

  const blogs = await fetchPublishedBlogsForSitemap({
    publicationId: publication.id,
  });

  const entries = [
    {
      url: getPublicationPageUrl(publication, "/blog"),
      lastModified: publication.updatedAt
        ? new Date(publication.updatedAt).toISOString()
        : undefined,
    },
    ...blogs.map((blog) => ({
      url: getPublicationPageUrl(publication, `/blog/${blog.slug}`),
      lastModified: blog.updatedAt
        ? new Date(blog.updatedAt).toISOString()
        : blog.publishedAt
          ? new Date(blog.publishedAt).toISOString()
          : undefined,
    })),
  ];

  return new Response(buildSitemapXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": SITEMAP_CACHE_CONTROL,
    },
  });
}
