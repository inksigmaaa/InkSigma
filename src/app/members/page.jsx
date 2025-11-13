import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import Members from "../components/members/Members";

export default function MembersPage() {
    return (
        <>
            <NavbarLoggedin />
            <Sidebar />
            <Verify />
            <Members />
        </>
    )
}