"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import ShareMenu from "../ShareMenu/ShareMenu";
import { getImageUrl } from "@/utils/imageUrl";
import CategoryBadgeList from "@/components/CategoryBadgeList";
import { getThumbnailWithFallback } from "@/utils/fallbackThumbnail";
import { getApiBase } from "@/utils/apiBase";
import { getBlogPath } from "@/utils/blogUrl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const API_URL = getApiBase();

export default function AllArticles({
  searchQuery = "",
  selectedCategory = "",
  blogs = [],
}) {
  const pathname = usePathname();

  // Filter articles based on search query and selected category
  const filteredArticles = blogs.filter((article) => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        (article.categories &&
          article.categories.some((cat) =>
            cat.toLowerCase().includes(query),
          )) ||
        article.author?.name.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Filter by selected category
    if (
      selectedCategory &&
      (!article.categories || !article.categories.includes(selectedCategory))
    ) {
      return false;
    }

    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  };

  return (
    <section className="w-full max-w-[90%] md:max-w-[70%] mx-auto py-6 md:py-12 px-4 md:px-0">
      <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-black">
        All Blog {searchQuery && `(${filteredArticles.length} results)`}
      </h2>

      {filteredArticles.length === 0 ? (
        <p className="text-gray-500">
          {searchQuery
            ? `No articles found for "${searchQuery}"`
            : "No articles available yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-20 md:mb-40 pb-10">
          {filteredArticles.map((article) => {
            const dateFormatted = formatDate(
              article.publishedAt || article.createdAt,
            );
            const thumbnailUrl = getThumbnailWithFallback(getImageUrl(article.image), article.id);

            return (
              <div
                key={article.id}
                className="border border-gray-200 rounded-lg hover:shadow-lg transition-shadow bg-white p-3 flex flex-col"
              >
                {/* Author and Date */}
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Avatar className="w-[29px] h-[29px] bg-gray-300 flex-shrink-0">
                      {article.author?.image && (
                        <AvatarImage
                          src={
                            article.author.image.startsWith("http")
                              ? article.author.image
                              : `${API_URL}${article.author.image}`
                          }
                          alt={article.author.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <AvatarFallback className="w-full h-full bg-purple-100 text-purple-600 font-semibold text-sm">
                        {article.author?.name?.charAt(0).toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <span className=" text-[#7E7B7B] text-[16px] font-normal leading-[136%] max-md:text-[#000000] max-md:font-medium max-md:text-[12px]">
                      {article.author?.name || "Anonymous"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[#808080] text-normal text-[14px] leading-[150%] max-md:text-xs max-md:font-medium whitespace-nowrap">
                      {dateFormatted}
                    </div>
                  </div>
                </div>

                {/* Blog Card */}
                <div className="relative w-full h-[200px] md:h-[280px] rounded-lg group mb-3 md:mb-4">
                  {/* Share Button */}
                  <div className="absolute top-5 right-4 max-md:top-3 max-md:right-2.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-50">
                    <ShareMenu
                      title={article.title}
                      slug={article.slug}
                      blogId={article.id}
                    />
                  </div>

                  <Link
                    href={getBlogPath(article.slug, pathname)}
                    className="absolute inset-0 rounded-lg overflow-hidden cursor-pointer block"
                  >
                    {/* Background Image */}
                    <Image
                      src={thumbnailUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </Link>
                </div>

                {/* Title and Description - Flex grow to push category down */}
                <div className="flex-grow mb-3 md:mb-4">
                  <h3 className="text-2xl font-extrabold mb-1 md:mb-2 text-[#080808] leading-8 line-clamp-2 max-md:text-[16px]">
                    {article.title}
                  </h3>
                  <p className="text-[#696969] font-light text-xs md:text-sm leading-[150%] line-clamp-2 max-md:text-[#808080] max-md:text-[12px]">
                    {article.description}
                  </p>
                </div>

                {/* Category - Always at bottom */}
                <div className="mt-auto overflow-hidden">
                  <CategoryBadgeList
                    categories={
                      article.categories && article.categories.length > 0
                        ? article.categories
                        : []
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
