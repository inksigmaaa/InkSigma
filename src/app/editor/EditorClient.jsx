"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronLeft, Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildScheduledForIso, splitScheduledForValue } from "@/lib/blogs/presentation";

import { CategoryDropdown } from "./components/CategoryDropdown";
import { DateTimePicker } from "./components/DateTimePicker";
import { ThumbnailModal } from "./components/ThumbnailModal";
import { TiptapEditor } from "./components/TiptapEditor";

const STATUS_LABELS = {
    draft: { color: "bg-orange-400", text: "Draft" },
    published: { color: "bg-green-500", text: "Published" },
    scheduled: { color: "bg-blue-500", text: "Scheduled" },
    unpublished: { color: "bg-amber-500", text: "Unpublished" },
    trash: { color: "bg-red-500", text: "Trash" },
};

async function readErrorMessage(response) {
    try {
        const payload = await response.json();
        return payload.error ?? "Request failed";
    } catch {
        return "Request failed";
    }
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
    });
}

export default function EditorClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const blogId = searchParams.get("id");

    const [status, setStatus] = useState("draft");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [publishDate, setPublishDate] = useState("");
    const [publishTime, setPublishTime] = useState("");
    const [charCount, setCharCount] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [editorContent, setEditorContent] = useState("");
    const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false);
    const [thumbnailImage, setThumbnailImage] = useState(null);
    const [isDateTimePickerOpen, setIsDateTimePickerOpen] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [isLoading, setIsLoading] = useState(Boolean(blogId));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savedBlogId, setSavedBlogId] = useState(blogId ?? null);

    useEffect(() => {
        if (!blogId) {
            return;
        }

        let isActive = true;

        const loadBlog = async () => {
            setIsLoading(true);
            setError("");

            try {
                const response = await fetch(`/api/blogs/${blogId}`, {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(await readErrorMessage(response));
                }

                const payload = await response.json();
                const blog = payload.blog;
                const scheduledValues = splitScheduledForValue(blog.scheduledFor);

                if (!isActive) {
                    return;
                }

                setSavedBlogId(String(blog.id));
                setStatus(blog.status);
                setTitle(blog.title);
                setDescription(blog.description);
                setEditorContent(blog.content);
                setSelectedCategories(blog.categories ?? []);
                setPublishDate(scheduledValues.date);
                setPublishTime(scheduledValues.time);
                setThumbnailImage(
                    blog.image
                        ? {
                              altText: blog.title,
                              src: blog.image,
                              title: blog.title,
                          }
                        : null
                );
            } catch (loadError) {
                if (isActive) {
                    setError(loadError.message);
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        loadBlog();

        return () => {
            isActive = false;
        };
    }, [blogId]);

    const handleEditorUpdate = ({ html, charCount: chars, wordCount: words }) => {
        setEditorContent(html);
        setCharCount(chars);
        setWordCount(words);
    };

    const submitBlog = async (action) => {
        setIsSubmitting(true);
        setError("");
        setNotice("");

        try {
            const scheduledFor = buildScheduledForIso(publishDate, publishTime);
            const payload = {
                action,
                categories: selectedCategories,
                content: editorContent,
                description,
                image: thumbnailImage?.src ?? null,
                scheduledFor,
                title,
            };
            const requestUrl = savedBlogId ? `/api/blogs/${savedBlogId}` : "/api/blogs";
            const requestMethod = savedBlogId ? "PATCH" : "POST";

            const response = await fetch(requestUrl, {
                method: requestMethod,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(await readErrorMessage(response));
            }

            const result = await response.json();
            const savedBlog = result.blog;
            setSavedBlogId(String(savedBlog.id));
            setStatus(savedBlog.status);
            setNotice(
                action === "draft"
                    ? "Draft saved"
                    : action === "publish"
                      ? "Article published"
                      : "Article scheduled"
            );

            if (action === "publish") {
                router.push("/published");
                return;
            }

            if (action === "schedule") {
                router.push("/schedule");
            }
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleThumbnailAdd = async (imageData) => {
        if (!imageData?.file) {
            return;
        }

        try {
            const src = await readFileAsDataUrl(imageData.file);
            setThumbnailImage({
                altText: imageData.altText,
                src,
                title: imageData.title,
            });
        } catch (thumbnailError) {
            setError(thumbnailError.message);
        }
    };

    const handleGoBack = () => {
        if (status === "scheduled") {
            router.push("/schedule");
            return;
        }

        if (status === "published") {
            router.push("/published");
            return;
        }

        router.push("/draft");
    };

    const statusConfig = STATUS_LABELS[status] ?? STATUS_LABELS.draft;

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <div className="px-4 md:px-6 pt-6 pb-4 border-b border-gray-200 bg-white md:bg-transparent md:border-0">
                <Button
                    variant="ghost"
                    onClick={handleGoBack}
                    className="text-gray-500 hover:text-gray-700 px-2 gap-1"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Go Back
                </Button>
            </div>

            <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {notice && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {notice}
                    </div>
                )}

                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-gray-200">
                    <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                    <span className="text-gray-500 text-sm">{statusConfig.text}</span>
                </div>

                <div>
                    <Input
                        type="text"
                        placeholder="Title of the Blog..."
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="text-3xl md:text-4xl font-bold border-0 px-0 focus-visible:ring-0 focus:outline-none placeholder:text-gray-300 bg-transparent outline-none shadow-none"
                    />
                </div>

                <div>
                    <Input
                        type="text"
                        placeholder="Write your Short Description for your Blog..."
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className="text-base text-gray-400 border-0 px-0 focus-visible:ring-0 focus:outline-none placeholder:text-gray-300 bg-transparent outline-none shadow-none"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 py-4 border-y border-gray-200">
                    <CategoryDropdown
                        selectedCategories={selectedCategories}
                        onCategoriesChange={setSelectedCategories}
                    />

                    <Button
                        variant="outline"
                        className="gap-2 bg-white"
                        onClick={() => setIsThumbnailModalOpen(true)}
                    >
                        <ImageIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">
                            {thumbnailImage ? "Change Thumbnail" : "Thumbnail Image"}
                        </span>
                        <span className="sm:hidden">{thumbnailImage ? "Change" : "Thumbnail"}</span>
                    </Button>

                    <div className="ml-auto flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => submitBlog("draft")}
                            disabled={isSubmitting || isLoading}
                        >
                            {isSubmitting ? "Saving..." : "Save Draft"}
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-lg border border-gray-200 bg-white px-6 py-20 text-center text-gray-500">
                        Loading article...
                    </div>
                ) : (
                    <TiptapEditor onUpdate={handleEditorUpdate} initialContent={editorContent} />
                )}

                <div className="space-y-4 pt-6">
                    <div className="flex justify-end">
                        <div className="text-sm text-gray-400">
                            <span>
                                Chars <span className="text-gray-600">{charCount}</span>
                            </span>
                            <span className="mx-2">|</span>
                            <span>
                                Words <span className="text-gray-600">{wordCount}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3">
                        <Button
                            onClick={() => submitBlog("publish")}
                            disabled={isSubmitting || isLoading}
                            className="bg-black text-white hover:bg-gray-800 gap-2 px-6 rounded-lg w-full md:w-auto"
                        >
                            Publish Now
                            <img src="/editor-icons/publish.svg" alt="Publish" className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-0 rounded-lg overflow-hidden w-full md:w-auto">
                            <div className="flex items-center gap-2 md:gap-3 bg-white px-3 md:px-4 border border-gray-200 rounded-l-lg flex-1 md:flex-initial">
                                <Input
                                    type="text"
                                    value={publishDate}
                                    onChange={(event) => setPublishDate(event.target.value)}
                                    placeholder="dd-mm-yyyy"
                                    className="w-[100px] md:w-[130px] text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                                />
                                <Input
                                    type="text"
                                    value={publishTime}
                                    onChange={(event) => setPublishTime(event.target.value)}
                                    placeholder="--:--"
                                    className="w-[50px] md:w-[60px] text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none shadow-none outline-none text-gray-700"
                                />
                                <button
                                    onClick={() => setIsDateTimePickerOpen(true)}
                                    className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <Calendar className="h-5 w-5 text-gray-700" />
                                </button>
                            </div>

                            <button
                                onClick={() => submitBlog("schedule")}
                                disabled={isSubmitting || isLoading}
                                className="bg-gray-200 text-gray-700 text-sm font-medium px-4 md:px-6 py-2.5 rounded-r-lg border border-l-0 border-gray-200 disabled:text-gray-400"
                            >
                                Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ThumbnailModal
                isOpen={isThumbnailModalOpen}
                onClose={() => setIsThumbnailModalOpen(false)}
                onImageAdd={handleThumbnailAdd}
            />

            <DateTimePicker
                isOpen={isDateTimePickerOpen}
                onClose={() => setIsDateTimePickerOpen(false)}
                onDateTimeSelect={(date, time) => {
                    setPublishDate(date);
                    setPublishTime(time);
                }}
                selectedDate={publishDate}
                selectedTime={publishTime}
            />
        </div>
    );
}
