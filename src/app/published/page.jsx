"use client"

import { useState } from "react";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import { useArticles } from "@/contexts/ArticlesContext";

export default function Published() {
    const { articles, loading, error, unpublishArticle } = useArticles();
    const [selectedArticles, setSelectedArticles] = useState([]);

    // Filter published articles
    const publishedArticles = articles.filter(article => article.status === 'published');

    const handleArticleSelect = (id, isSelected) => {
        setSelectedArticles(prev => 
            isSelected 
                ? [...prev, id]
                : prev.filter(articleId => articleId !== id)
        );
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedArticles(publishedArticles.map(article => article.id));
        } else {
            setSelectedArticles([]);
        }
    };

    const handleCopy = () => {
        console.log("Copy articles:", selectedArticles);
        // Add copy logic here
    };

    const handleUnpublish = async () => {
        if (selectedArticles.length === 0) return;
        
        try {
            // Unpublish selected articles
            for (const articleId of selectedArticles) {
                await unpublishArticle(articleId);
            }
            
            // Clear selection
            setSelectedArticles([]);
            
            // Show success message
            alert(`${selectedArticles.length} article(s) moved to unpublished successfully!`);
        } catch (error) {
            console.error('Error unpublishing articles:', error);
            alert('Failed to unpublish articles. Please try again.');
        }
    };

    if (loading) {
        return (
            <>
                <NavbarLoggedin />
                <Sidebar />
                <Verify />
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-gray-500">Loading published articles...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <NavbarLoggedin />
                <Sidebar />
                <Verify />
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-red-500">Error: {error}</div>
                </div>
            </>
        );
    }

    const hasSelectedArticles = selectedArticles.length > 0;

    const actionButtons = [
        { 
            icon: "/images/icons/draft1.svg", 
            title: "Copy", 
            onClick: handleCopy,
            disabled: !hasSelectedArticles 
        },
        { 
            icon: "/images/icons/trash2.svg", 
            title: "Unpublish", 
            onClick: handleUnpublish,
            disabled: !hasSelectedArticles 
        },
    ];

    return (
        <>
            <NavbarLoggedin />
            <Sidebar />
            <Verify />
            <PersonalArticles
                title="Published"
                titleColor="#267F24"
                articles={publishedArticles}
                emptyMessage="No published articles yet"
                showSelectAll={true}
                showActions={true}
                actionButtons={actionButtons}
                selectedArticles={selectedArticles}
                onSelectAll={handleSelectAll}
                onArticleSelect={handleArticleSelect}
            />
        </>
    );
}
