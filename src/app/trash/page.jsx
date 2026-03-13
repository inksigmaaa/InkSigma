import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import BlogStatusPage from "../components/blogs/BlogStatusPage";

export default function TrashPage() {
    return (
        <>
            <NavbarLoggedin />
            <Sidebar />
            <Verify />
            <BlogStatusPage
                bulkActions={[
                    { action: "restore", icon: "/images/icons/restore.svg", title: "Restore" },
                    { action: "delete", icon: "/images/icons/trash1.svg", title: "Delete" },
                ]}
                emptyMessage="No trashed articles yet"
                showActions
                showSelectAll
                status="trash"
                title="Trash"
                titleColor="#DC2626"
            />
        </>
    );
}
