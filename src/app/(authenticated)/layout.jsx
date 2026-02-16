import NavbarLoggedin from "@/app/components/navbar/NavbarLoggedin";

export default function AuthenticatedLayout({ children }) {
  return (
    <>
      <NavbarLoggedin />
      {children}
    </>
  );
}
