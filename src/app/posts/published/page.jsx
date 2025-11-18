import NavbarLoggedin from "../../components/navbar/NavbarLoggedin";
import MemberSidebar from "../../membersidebar/MemberSidebar";
import Verify from "../../components/verify/Verify";
import Articles from "../../components/articles/Articles";

export default function PostsPublished() {
    return (
        <>
            <NavbarLoggedin />
            <MemberSidebar />
            <Verify />
            <Articles
                title="Published"
                filterStatus="published"
                showCreateButton={false}
            />
        </>
    )
}
