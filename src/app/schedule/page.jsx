import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import SchedulePageClient from "../components/schedule/SchedulePageClient"

export default function SchedulePage() {
  // This could come from props, API call, or database in a real app
  const posts = [
    {
      id: 1,
      title: "Title of the Blog will be in this area",
      excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      tags: ["Sports", "Humour", "History"],
      postedTime: "Posted 2 mins ago"
    },
    {
      id: 2,
      title: "Title of the Blog will be in this area",
      excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin bibendum efficitur tortorsdkhbishdoisa...",
      tags: ["Sports", "Humour", "History"],
      postedTime: "Posted 2 mins ago"
    }
  ]

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <SchedulePageClient posts={posts} />
    </>
  )
}