"use client";

import { useMemo, useState } from "react";

import AllArticles from "./components/AllArticles/AllArticles";
import Footer from "./components/Footer/Footer";
import ViewSiteHeader from "./components/Header/Header";
import LatestBlog from "./components/LatestBlog/LatestBlog";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

export default function ViewSiteClient({ blogs, publication }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredBlogs = useMemo(() => {
        if (!searchQuery) {
            return blogs;
        }

        const normalizedQuery = searchQuery.toLowerCase();

        return blogs.filter((blog) => {
            const categoryMatch = (blog.categories ?? []).some((category) =>
                category.toLowerCase().includes(normalizedQuery)
            );

            return (
                blog.title.toLowerCase().includes(normalizedQuery) ||
                blog.description.toLowerCase().includes(normalizedQuery) ||
                blog.author.name.toLowerCase().includes(normalizedQuery) ||
                categoryMatch
            );
        });
    }, [blogs, searchQuery]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ViewSiteHeader
                userAvatar={publication.image}
                userName={publication.name}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <div className="flex-grow">
                <LatestBlog blogs={blogs} publicationSubdomain={publication.subdomain} searchQuery={searchQuery} />
                <AllArticles
                    blogs={filteredBlogs}
                    publicationSubdomain={publication.subdomain}
                    searchQuery={searchQuery}
                />
            </div>
            <Footer publicationName={publication.name} />
            <ScrollToTop />
        </div>
    );
}
