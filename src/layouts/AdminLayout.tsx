import { Outlet, Navigate, useLocation } from "react-router";
import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { useAuth } from "@/contexts/AuthContext";

export function AdminLayout() {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="font-body-md text-on-surface flex min-h-screen bg-background">
      <Sidebar />
      <Header />

      {/* Main Canvas */}
      <main className="ml-0 md:ml-[280px] mt-16 p-6 md:p-10 w-full max-w-[1440px] mx-auto transition-all animate-in fade-in duration-500">
        <Outlet />
      </main>
    </div>
  );
}
