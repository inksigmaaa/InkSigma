import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import BlogStatusPage from "../components/blogs/BlogStatusPage";

export default function DraftPage() {
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
                emptyMessage="No draft articles yet"
                showActions
                showSelectAll
                status="draft"
                title="Drafts"
                titleColor="#F97316"
            />
        </>
    );
}
