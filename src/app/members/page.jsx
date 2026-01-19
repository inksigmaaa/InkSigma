'use client';

import { usePublication } from "@/contexts/PublicationContext";
import NavbarLoggedin from "../components/navbar/NavbarLoggedin";
import Sidebar from "../components/sidebar/Sidebar";
import EditorSidebar from "../components/sidebar/EditorSidebar";
import Verify from "../components/verify/Verify";
import Members from "../components/members/Members";

export default function MembersPage() {
    const { currentPublication } = usePublication();
    
    return (
        <>
            <NavbarLoggedin />
            {currentPublication?.role === 'editor' ? <EditorSidebar /> : <Sidebar />}
            <Verify />
            <Members />
        </>
    )
}