"use client"

import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import PersonalArticles from "../components/personalArticles/personalArticles";
import { useArticles } from "@/contexts/ArticlesContext";

export default function SchedulePage() {
  const { articles, loading, error } = useArticles();

  // Filter scheduled articles
  const scheduledArticles = articles.filter(article => article.status === 'scheduled');

  if (loading) {
    return (
      <>
        <NavbarLoggedin />
        <Sidebar />
        <Verify />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">Loading scheduled articles...</div>
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

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <PersonalArticles
        title="Scheduled"
        titleColor="#0048B5"
        articles={scheduledArticles}
        emptyMessage="No scheduled articles yet"
        showSelectAll={true}
        showActions={false}
      />
    </>
  );
}