import DashboardSimpleSidebar from "@/app/components/sidebar/DashboardSimpleSidebar";

export default function UserLayout({ children }) {
  return (
    <>
      <DashboardSimpleSidebar />
      {children}
    </>
  );
}
