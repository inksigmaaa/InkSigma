import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import BlogStatusPage from "../components/blogs/BlogStatusPage";

export default function MyBlogsPage() {
    return (
        <>
            <NavbarLoggedin />
            <Sidebar />
            <Verify />
            <BlogStatusPage
                emptyMessage="No articles yet"
                status="all"
                title="My Blogs"
                titleColor="#EC4899"
            />
        </>
    );
}
