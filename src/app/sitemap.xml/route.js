import { headers } from "next/headers";
import {
  buildSitemapXml,
  fetchPublicationForMetadata,
  fetchPublishedBlogsForSitemap,
  getRequestHost,
} from "@/utils/publicationSeo";
import { getPublicationPageUrl } from "@/utils/publicationDomain";
import { parseHost } from "@/utils/hostParser";

export async function GET() {
  const headerList = await headers();
  const host = getRequestHost(headerList);
  const parsedHost = parseHost(host);

  if (parsedHost.isDashboard) {
    return new Response(buildSitemapXml([]), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const publication = await fetchPublicationForMetadata({ host });

  if (!publication?.id) {
    return new Response(buildSitemapXml([]), {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const blogs = await fetchPublishedBlogsForSitemap({
    publicationId: publication.id,
  });

  const entries = [
    {
      url: getPublicationPageUrl(publication, "/"),
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
      "Cache-Control": "no-store",
    },
  });
}
