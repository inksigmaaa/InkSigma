import NavbarLoggedin from "../components/navbar/NavbarLoggedin"
import Sidebar from "../components/sidebar/Sidebar"
import Verify from "../components/verify/Verify"
import ReviewPageClient from "../components/review/ReviewPageClient"

export default function AuthorReviewPage() {
  // This could come from props, API call, or database in a real app
  const article = {
    id: 1,
    title: "Journey Beyond",
    author: "Mocas Nicota",
    tags: ["Sports", "Humour", "History"],
    date: "FRI | 15 NOV, 2024",
    status: "Draft"
  }

  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <ReviewPageClient article={article} />
    </>
  )
}