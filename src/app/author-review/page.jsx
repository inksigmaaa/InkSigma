import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Verify from "../components/verify/Verify"
import ReviewPageClient from "../components/review/ReviewPageClient"
import MemberSidebar from "../membersidebar/MemberSidebar"

export default function AuthorReviewPage() {
  // This could come from props, API call, or database in a real app
  const articles = [
    {
      id: 1,
      title: "Journey Beyond",
      author: "Mocas Nicota",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024",
      status: "Draft",
      avatar: "S"
    },
    {
      id: 2,
      title: "Wanderlust Diaries",
      author: "John Cena",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024",
      status: "Draft"
    },
    {
      id: 3,
      title: "Globe Trotter",
      author: "Randy Ortan",
      tags: ["Sports", "Humour", "History"],
      date: "FRI | 15 NOV, 2024",
      status: "Draft"
    }
  ]

  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar />
      <Verify />
      <ReviewPageClient articles={articles} />
    </>
  )
}