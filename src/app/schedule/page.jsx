"use client"

import { useState } from "react";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";

export default function SchedulePage() {
  const [selectedArticles, setSelectedArticles] = useState([]);

  const articles = [
    {
      id: 1,
      status: "scheduled",
      title: "Title of the Blog will be in this area",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      categories: ["Sports", "Humour", "History"],
      postedTime: "Posted 2 mins ago",
    },
    {
      id: 2,
      status: "scheduled",
      title: "Another Scheduled Blog Title",
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

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <PersonalArticles
        title="Schedule"
        titleColor="#0EA5E9"
        articles={articles}
        emptyMessage="No scheduled articles yet"
        selectedArticles={selectedArticles}
        onArticleSelect={handleArticleSelect}
      />
    </>
  )
}