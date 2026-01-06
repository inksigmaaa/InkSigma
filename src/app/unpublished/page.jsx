"use client"

import { useState } from "react";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import { useArticles } from "@/contexts/ArticlesContext";

export default function Unpublished() {
  const { articles, loading, error, publishArticle, moveToDraft } = useArticles();
  const [selectedArticles, setSelectedArticles] = useState([]);

  // Filter unpublished articles (articles that were published but then unpublished)
  const unpublishedArticles = articles.filter(article => article.status === 'unpublished');

  const handleArticleSelect = (id, isSelected) => {
    setSelectedArticles(prev =>
      isSelected
        ? [...prev, id]
        : prev.filter(articleId => articleId !== id)
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(unpublishedArticles.map(article => article.id));
    } else {
      setSelectedArticles([]);
    }
  };

  const handleCopy = () => {
    console.log("Copy articles:", selectedArticles);
    // Add copy logic here
  };

  const handleRepublish = async () => {
    if (selectedArticles.length === 0) return;
    
    try {
      // Republish selected articles
      for (const articleId of selectedArticles) {
        await publishArticle(articleId);
      }
      
      // Clear selection
      setSelectedArticles([]);
      
      // Show success message
      alert(`${selectedArticles.length} article(s) republished successfully!`);
    } catch (error) {
      console.error('Error republishing articles:', error);
      alert('Failed to republish articles. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (selectedArticles.length === 0) return;
    
    if (!confirm(`Are you sure you want to move ${selectedArticles.length} article(s) to drafts? They will be removed from unpublished and moved to drafts.`)) {
      return;
    }
    
    try {
      // Move selected articles to draft status (Unpublished-to-Draft Deletion Rule)
      for (const articleId of selectedArticles) {
        await moveToDraft(articleId);
      }
      
      // Clear selection
      setSelectedArticles([]);
      
      // Show success message
      alert(`${selectedArticles.length} article(s) moved to drafts successfully!`);
    } catch (error) {
      console.error('Error moving articles to draft:', error);
      alert('Failed to move articles to drafts. Please try again.');
    }
  };

  if (loading) {
    return (
      <>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">Loading unpublished articles...</div>
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
      icon: "/images/icons/publish.svg",
      title: "Republish",
      onClick: handleRepublish,
      disabled: !hasSelectedArticles
    },
    {
      icon: "/images/icons/trash2.svg",
      title: "Move to Draft",
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
        title="Unpublished"
        titleColor="#D97706"
        articles={unpublishedArticles}
        emptyMessage="No unpublished articles yet"
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
