"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PersonalArticles from "../personalArticles/personalArticles";

import { formatBlogTimestamp } from "@/lib/blogs/presentation";

async function readErrorMessage(response) {
    try {
        const payload = await response.json();
        return payload.error ?? "Request failed";
    } catch {
        return "Request failed";
    }
}

export default function BlogStatusPage({
    bulkActions = [],
    emptyMessage,
    showActions = false,
    showSelectAll = false,
    status,
    title,
    titleColor,
}) {
    const router = useRouter();
    const [blogs, setBlogs] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedArticles, setSelectedArticles] = useState([]);

    const loadBlogs = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/blogs?status=${status}`, {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(await readErrorMessage(response));
            }

            const payload = await response.json();
            setBlogs(payload.blogs ?? []);
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBlogs();
    }, [status]);

    const applyBulkAction = async (action, ids) => {
        if (ids.length === 0) {
            return;
        }

        const response = await fetch("/api/blogs/actions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                action,
                ids,
            }),
        });

        if (!response.ok) {
            throw new Error(await readErrorMessage(response));
        }

        setSelectedArticles([]);
        await loadBlogs();
    };

    const mappedArticles = useMemo(
        () =>
            blogs.map((blog) => ({
                categories: blog.categories ?? [],
                description: blog.description,
                id: blog.id,
                onDelete: async () => {
                    try {
                        await applyBulkAction(blog.status === "trash" ? "delete" : "trash", [blog.id]);
                    } catch (actionError) {
                        setError(actionError.message);
                    }
                },
                onEdit:
                    blog.status === "trash"
                        ? undefined
                        : () => {
                              router.push(`/editor?id=${blog.id}`);
                          },
                onPublish:
                    blog.status === "draft" ||
                    blog.status === "scheduled" ||
                    blog.status === "unpublished"
                        ? async () => {
                              try {
                                  await applyBulkAction("publish", [blog.id]);
                              } catch (actionError) {
                                  setError(actionError.message);
                              }
                          }
                        : undefined,
                onRestore:
                    blog.status === "trash"
                        ? async () => {
                              try {
                                  await applyBulkAction("restore", [blog.id]);
                              } catch (actionError) {
                                  setError(actionError.message);
                              }
                          }
                        : undefined,
                onUnpublish:
                    blog.status === "published"
                        ? async () => {
                              try {
                                  await applyBulkAction("unpublish", [blog.id]);
                              } catch (actionError) {
                                  setError(actionError.message);
                              }
                          }
                        : undefined,
                postedTime: formatBlogTimestamp(blog),
                status: blog.status,
                title: blog.title,
            })),
        [blogs, router]
    );

    const actionButtons = bulkActions.map((action) => ({
        ...action,
        disabled: selectedArticles.length === 0,
        onClick: async () => {
            try {
                await applyBulkAction(action.action, selectedArticles);
            } catch (actionError) {
                setError(actionError.message);
            }
        },
    }));

    return (
        <>
            {error && (
                <div className="absolute left-1/2 -translate-x-1/2 top-[160px] w-full max-w-[1034px] px-5 z-30">
                    <div className="ml-[185px] max-md:ml-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                </div>
            )}

            <PersonalArticles
                actionButtons={actionButtons}
                articles={mappedArticles}
                emptyMessage={emptyMessage}
                loading={loading}
                onArticleSelect={(id, checked) => {
                    setSelectedArticles((currentValue) =>
                        checked
                            ? [...currentValue, id]
                            : currentValue.filter((articleId) => articleId !== id)
                    );
                }}
                onSelectAll={(checked) => {
                    setSelectedArticles(checked ? mappedArticles.map((article) => article.id) : []);
                }}
                selectedArticles={selectedArticles}
                showActions={showActions}
                showSelectAll={showSelectAll}
                title={title}
                titleColor={titleColor}
            />
        </>
    );
}
