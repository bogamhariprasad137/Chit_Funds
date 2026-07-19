import { NavLink } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Menu, 
  X, 
  Landmark, 
  LayoutDashboard, 
  Clock, 
  Receipt, 
  Boxes, 
  Users, 
  Coins, 
  BarChart3, 
  Settings, 
  LogOut 
} from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar() {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Implement body scroll lock when mobile menu drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/pending", icon: Clock, label: "Pending Payments" },
    { to: "/payments", icon: Receipt, label: "Payments Ledger" },
    { to: "/groups", icon: Boxes, label: "Chit Groups" },
    { to: "/members", icon: Users, label: "Members List" },
    { to: "/releases", icon: Coins, label: "Chit Releases" },
    { to: "/reports", icon: BarChart3, label: "Financial Reports" },
  ];

  return (
    <>
      {/* Mobile Toggle Button (Guaranteed 44px x 44px touch target) */}
      <button 
        className="md:hidden fixed top-3 left-4 z-[60] p-2.5 bg-milk text-plum rounded-lg shadow-plum-sm border border-plum/20 hover:bg-milk/95 transition-all duration-200 active:scale-95 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay Backdrop (z-40 to remain below the sidebar container z-50) */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-plum/30 backdrop-blur-xs z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container (z-50 above backdrop and header) */}
      <nav className={`
        fixed left-0 top-0 h-full w-[260px] bg-plum flex flex-col pt-16 pb-6 px-4 z-50 border-r border-milk/10 shadow-milk-lg
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand/Logo Header */}
        <div className="mb-8 px-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-milk flex items-center justify-center text-plum shadow-milk-sm transition-transform duration-200 hover:rotate-6">
            <Landmark className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-milk leading-none">
              Chit<span className="text-milk/80 font-medium">Ledger</span>
            </h1>
            <p className="text-[9px] font-bold text-milk/60 uppercase tracking-wider mt-1">
              Financial Suite
            </p>
          </div>
        </div>
        
        {/* Navigation list */}
        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-hide flex-1 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  group flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all duration-200 ease-in-out active:scale-[0.97] relative text-[13px] font-bold cursor-pointer min-h-[44px]
                  ${isActive 
                    ? 'bg-milk text-plum shadow-milk-sm translate-x-1 pl-2.5' 
                    : 'text-milk/75 hover:text-milk hover:bg-milk/10 hover:translate-x-0.5'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon 
                      className={`w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-105 ${
                        isActive ? 'text-plum' : 'text-milk/60 group-hover:text-milk'
                      }`}
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
          
          {/* Settings Section */}
          <div className="mt-3 pt-3 border-t border-milk/10">
            <NavLink
              to="/settings"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                group flex items-center gap-2.5 px-3.5 py-3 rounded-lg transition-all duration-200 ease-in-out active:scale-[0.97] relative text-[13px] font-bold cursor-pointer min-h-[44px]
                ${isActive 
                  ? 'bg-milk text-plum shadow-milk-sm translate-x-1 pl-2.5' 
                  : 'text-milk/75 hover:text-milk hover:bg-milk/10 hover:translate-x-0.5'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Settings 
                    className={`w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-105 ${
                      isActive ? 'text-plum' : 'text-milk/60 group-hover:text-milk'
                    }`}
                  />
                  <span className="tracking-tight">System Settings</span>
                </>
              )}
            </NavLink>
          </div>
        </div>

        {/* Footer Log Out Area */}
        <div className="mt-auto pt-4 border-t border-milk/10 px-1">
          <button 
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="flex items-center gap-2.5 w-full px-3.5 py-3 rounded-lg text-milk/90 hover:bg-milk/10 hover:text-milk transition-all duration-200 ease-in-out active:scale-[0.97] text-[13px] font-bold cursor-pointer hover:translate-x-0.5 min-h-[44px]"
          >
            <LogOut className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-105" />
            <span className="tracking-tight">Sign Out Session</span>
          </button>
        </div>
      </nav>
    </>
  );
}
