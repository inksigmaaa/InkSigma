"use client"

import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"
import Members from "../../components/members/Members"

export default function MembersPage() {
  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar />
      <Members />
    </>
  )
}
