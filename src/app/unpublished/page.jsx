"use client"

import { useState } from "react";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";

export default function Unpublished() {
  const [selectedArticles, setSelectedArticles] = useState([]);
  const articles = [];

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
        title="Unpublished"
        titleColor="#D97706"
        articles={articles}
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
