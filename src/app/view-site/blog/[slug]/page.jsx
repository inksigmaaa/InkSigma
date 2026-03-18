import { headers } from "next/headers";
import BlogDetailPageClient from "./BlogDetailPageClient";
import {
  buildPublicationMetadata,
  fetchBlogForMetadata,
} from "@/utils/publicationSeo";

const API_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

export async function generateMetadata({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ||
    headerList.get("host") ||
    "";

  const blog = await fetchBlogForMetadata({ host, slug });

  if (!blog?.publicationId) {
    return {};
  }

  let publication = null;
  try {
    const publicationResponse = await fetch(
      `${API_URL}/api/publications/${blog.publicationId}`,
      { cache: "no-store" },
    );

    if (publicationResponse.ok) {
      publication = await publicationResponse.json();
    }
  } catch {}

  return buildPublicationMetadata({
    publication,
    pathname: `/blog/${slug}`,
    title: blog?.title,
    description: blog?.description,
    image: blog?.image || publication?.metaOgImageUrl || publication?.logoUrl,
    type: "article",
  });
}

export default async function BlogDetailPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  return <BlogDetailPageClient slug={resolvedParams?.slug} />;
}
