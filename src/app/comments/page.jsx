import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import CommentsComponent from "../components/comments/Comments";

export default function CommentsPage() {
    return (
        <>
            <NavbarLoggedin />
            <Sidebar />
            <Verify />
            <CommentsComponent />
        </>
    )
}