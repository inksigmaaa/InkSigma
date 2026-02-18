import NavbarLoggedin from "@/components/layout/navbar/NavbarLoggedin";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import Verify from "@/components/features/verify/Verify";
import CommentsComponent from "@/components/features/comments/Comments";

export default function CommentsPage() {
  return (
    <>
      <NavbarLoggedin />
      <Sidebar />
      <Verify />
      <CommentsComponent />
    </>
  );
}
