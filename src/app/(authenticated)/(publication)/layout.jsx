import Sidebar from "@/app/components/sidebar/Sidebar";

export default function PublicationLayout({ children }) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}
