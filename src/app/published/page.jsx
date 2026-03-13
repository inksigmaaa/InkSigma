import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import BlogStatusPage from "../components/blogs/BlogStatusPage";

export default function PublishedPage() {
    return (
        <>
            <NavbarLoggedin />
            <Sidebar />
            <Verify />
            <BlogStatusPage
                bulkActions={[
                    { action: "unpublish", icon: "/images/icons/copy.svg", title: "Unpublish" },
                    { action: "trash", icon: "/images/icons/trash1.svg", title: "Move to trash" },
                ]}
                emptyMessage="No published articles yet"
                showActions
                showSelectAll
                status="published"
                title="Published"
                titleColor="#16A34A"
            />
        </>
    );
}
