import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  Clock, 
  CreditCard, 
  Users, 
  UserSquare2, 
  Megaphone, 
  FileText, 
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Pending", path: "/pending", icon: Clock },
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "Groups", path: "/groups", icon: Users },
  { label: "Members", path: "/members", icon: UserSquare2 },
  { label: "Releases", path: "/releases", icon: Megaphone },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="mt-auto px-4 py-4 bg-slate-100 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
            AL
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate text-slate-900">Admin</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Premium Tier</p>
          </div>
        </div>
        
        <button 
          onClick={useAuth().signOut} 
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-[260px] bg-slate-50 flex-col pt-20 pb-8 px-4 z-40 border-r border-slate-200">
      <SidebarNav />
    </aside>
  );
}
