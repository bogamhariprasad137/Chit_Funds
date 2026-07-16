import { useState } from "react";
import { Navigate, Outlet } from "react-router";
import { Header } from "@/components/shared/Header";
import { Sidebar } from "@/components/shared/Sidebar";
import { FloatingActionButton } from "@/components/shared/FloatingActionButton";
import { RecordPaymentModal } from "@/components/shared/RecordPaymentModal";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function AdminLayout() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <Header onOpenPaymentModal={() => setIsPaymentModalOpen(true)} />
      
      {/* Desktop Navigation */}
      <Sidebar />
      
      {/* Mobile Record Payment Action */}
      <FloatingActionButton onClick={() => setIsPaymentModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-20 pb-6 md:pl-[260px] px-4 md:px-10 min-h-screen">
        <div className="max-w-[1440px] mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Global Modals */}
      <RecordPaymentModal 
        open={isPaymentModalOpen} 
        onOpenChange={setIsPaymentModalOpen} 
      />
    </div>
  );
}
