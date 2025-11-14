import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import Verify from "../components/verify/Verify";
import Articles from "../components/articles/Articles";

export default function Posts() {
    return (
        <>
            <NavbarLoggedin />
            <Sidebar />
            <Verify />
            <Articles title={"All Articles"} />
        </>
    )
}