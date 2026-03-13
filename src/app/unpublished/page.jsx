import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import BlogStatusPage from "../components/blogs/BlogStatusPage";

export default function UnpublishedPage() {
    return (
        <>
            <NavbarLoggedin />
            <Sidebar />
            <Verify />
            <BlogStatusPage
                bulkActions={[
                    { action: "publish", icon: "/images/icons/Publish.svg", title: "Publish" },
                    { action: "trash", icon: "/images/icons/trash1.svg", title: "Move to trash" },
                ]}
                emptyMessage="No unpublished articles yet"
                showActions
                showSelectAll
                status="unpublished"
                title="Unpublished"
                titleColor="#D97706"
            />
        </>
    );
}
