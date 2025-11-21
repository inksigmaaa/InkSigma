"use client"

import { useState } from "react";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";

export default function Published() {
    const [selectedArticles, setSelectedArticles] = useState([]);

    const articles = [
        {
            id: 1,
            status: "published",
            title: "Title of the Blog will be in this area",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
            categories: ["Sports", "Humour", "History"],
            postedTime: "Posted 2 mins ago",
        },
        {
            id: 2,
            status: "published",
            title: "Another Blog Title Example",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
            categories: ["Technology", "Business"],
            postedTime: "Posted 5 mins ago",
        }
    ];

    const handleArticleSelect = (id, isSelected) => {
        setSelectedArticles(prev => 
            isSelected 
                ? [...prev, id]
                : prev.filter(articleId => articleId !== id)
        );
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedArticles(articles.map(article => article.id));
        } else {
            setSelectedArticles([]);
        }
    };

    const handleCopy = () => {
        console.log("Copy articles:", selectedArticles);
        // Add copy logic here
    };

    const handleDelete = () => {
        console.log("Delete articles:", selectedArticles);
        // Add delete logic here
    };

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
            title: "Delete", 
            onClick: handleDelete,
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
                articles={articles}
                emptyMessage="No published articles yet"
                showSelectAll={true}
                showActions={true}
                actionButtons={actionButtons}
                selectedArticles={selectedArticles}
                onSelectAll={handleSelectAll}
                onArticleSelect={handleArticleSelect}
            />
        </>
    )
}
