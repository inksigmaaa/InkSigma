import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import BackToHomeButton from "../../components/BackToHomeButton/BackToHomeButton";
import CommentSection from "../../components/CommentSection/CommentSection";
import Footer from "../../components/Footer/Footer";
import ViewSiteHeader from "../../components/Header/Header";
import ClockIcon from "../../components/icons/ClockIcon";
import MobileBottomNav from "../../components/MobileBottomNav/MobileBottomNav";
import ScrollToTop from "../../components/ScrollToTop/ScrollToTop";
import ShareButtons from "../../components/ShareButtons/ShareButtons";
import TableOfContents from "../../components/TableOfContents/TableOfContents";

import { getAuthBaseUrl } from "@/config/server-env";
import { sanitizeRichText } from "@/lib/sanitization";
import { getPublishedBlogBySlug } from "@/server/blogs/public";
import { resolvePublicationPreview } from "@/server/publications/service";

function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    const getOrdinal = (value) => {
        const suffixes = ["th", "st", "nd", "rd"];
        const remainder = value % 100;
        return value + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);
    };

    return {
        date: `${day} ${months[date.getMonth()]}, ${year}`,
        fullDate: `${getOrdinal(Number.parseInt(day, 10))} ${months[date.getMonth()]}`,
    };
}

export default async function BlogDetailPage({ params, searchParams }) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const publication = await resolvePublicationPreview(resolvedSearchParams?.publication ?? null);

    if (!publication) {
        notFound();
    }

    const blog = await getPublishedBlogBySlug(publication.id, resolvedParams.slug);

    if (!blog) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <ViewSiteHeader userAvatar={publication.image} userName={publication.name} />
                <div className="flex-grow max-w-[800px] mx-auto px-6 py-12">
                    <h1 className="text-4xl font-bold text-black mb-4">Blog not found</h1>
                    <Link
                        href={`/view-site?publication=${publication.subdomain}`}
                        className="text-purple-600 hover:text-purple-700"
                    >
                        Back to home
                    </Link>
                </div>
                <Footer publicationName={publication.name} />
            </div>
        );
    }

    const dateFormatted = formatDate(blog.publishedAt ?? blog.createdAt);
    const currentUrl = `${getAuthBaseUrl()}/view-site/blog/${blog.slug}?publication=${publication.subdomain}`;
    const safeContent = sanitizeRichText(blog.content);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <ViewSiteHeader userAvatar={publication.image} userName={publication.name} />

            <section className="flex-grow flex justify-center w-full px-4 md:px-6">
                <div className="flex max-w-[1400px] w-full justify-center gap-8">
                    <aside className="hidden lg:block flex-shrink-0 pt-20 space-y-0 w-[200px]">
                        <BackToHomeButton publicationSubdomain={publication.subdomain} />
                        <TableOfContents />
                    </aside>

                    <div className="flex-1 max-w-[800px] pb-20 md:pb-12 pt-6 md:pt-20 lg:pl-12 lg:border-l-2 min-w-0">
                        <h1 className="text-2xl leading-tight md:text-5xl font-bold text-black mb-4 md:mb-4 break-words">
                            {blog.title}
                        </h1>

                        <p className="text-sm leading-relaxed md:text-xl text-gray-500 mb-6 md:mb-8 break-words">
                            {blog.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6 md:hidden">
                            {(blog.categories ?? []).map((category) => (
                                <span
                                    key={`${blog.id}-${category}`}
                                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                >
                                    {category}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mb-6 md:mb-8 py-3 md:py-4 md:px-2 md:border-y md:border-gray-200">
                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                                    {blog.author?.avatar && (
                                        <Image
                                            src={blog.author.avatar}
                                            alt={blog.author.name}
                                            width={40}
                                            height={40}
                                            unoptimized
                                        />
                                    )}
                                </div>
                                <span className="text-gray-800 font-medium text-sm md:text-base truncate">
                                    {blog.author?.name || "Anonymous"}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
                                <ClockIcon className="md:w-4 md:h-4 flex-shrink-0" />
                                <span className="text-xs md:text-sm whitespace-nowrap">
                                    Published on {dateFormatted.fullDate || dateFormatted.date}
                                </span>
                            </div>
                        </div>

                        <div className="relative w-full h-[220px] md:h-[400px] rounded-lg md:rounded-2xl mb-6 md:mb-12 overflow-hidden">
                            {blog.thumbnail ? (
                                <Image
                                    src={blog.thumbnail}
                                    alt={blog.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                            )}
                        </div>

                        <article
                            className="prose prose-sm md:prose-lg max-w-none prose-headings:font-bold prose-headings:text-black prose-p:text-gray-700 prose-p:leading-relaxed break-words"
                            dangerouslySetInnerHTML={{ __html: safeContent }}
                        />

                        <CommentSection blogId={blog.id} />
                    </div>

                    <div className="hidden lg:block flex-shrink-0 w-[100px]">
                        <ShareButtons
                            description={blog.description}
                            slug={blog.slug}
                            title={blog.title}
                            url={currentUrl}
                        />
                    </div>
                </div>
            </section>

            <Footer publicationName={publication.name} />
            <ScrollToTop />

            <MobileBottomNav
                description={blog.description}
                sections={[]}
                slug={blog.slug}
                title={blog.title}
                url={currentUrl}
            />
        </div>
    );
}
