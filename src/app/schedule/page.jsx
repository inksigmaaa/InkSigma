"use client"

import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import SchedulePageClient from "../components/schedule/SchedulePageClient";

export default function SchedulePage() {
  // Mock data matching the image design
  const posts = [
    {
      id: 1,
      title: "Title of the Blog will be in this area",
      excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      tags: ["Sports", "Humour", "History"],
      postedTime: "Posted on 2nd Feb, 2023",
    },
    {
      id: 2,
      title: "Title of the Blog will be in this area",
      excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      tags: ["Sports", "Humour", "History"],
      postedTime: "Posted on 2nd Feb, 2023",
    }
  ];

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <SchedulePageClient posts={posts} />
    </>
  )
}