import { useLocation, useNavigate } from "react-router";
import { User, Bell, Globe, Check, ShieldAlert, CheckCircle2, Info, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || i18n.language || "en");
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  // Sync i18n instance on initial mount
  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  // Fetch pending collections count for dynamic notification alerts
  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const { count, error } = await supabase
          .from("pending_installments_view")
          .select("*", { count: "exact", head: true });
        if (!error && count !== null) {
          setPendingCount(count);
        }
      } catch (err) {
        console.error("Failed to load notifications counts:", err);
      } finally {
        setLoadingNotifs(false);
      }
    }
    fetchPendingCount();
  }, []);

  const pathnames = location.pathname.split("/").filter((x) => x);
  let breadcrumb = "Dashboard";
  
  if (pathnames.length > 0) {
    breadcrumb = pathnames[0].charAt(0).toUpperCase() + pathnames[0].slice(1);
  }
  
  if (pathnames.includes("settings")) breadcrumb = "System Settings";
  else if (pathnames.includes("groups")) breadcrumb = "Chit Groups";
  else if (pathnames.includes("members")) breadcrumb = "Members Directory";
  else if (pathnames.includes("pending")) breadcrumb = "Pending Payments";
  else if (pathnames.includes("releases")) breadcrumb = "Chit Releases";
  else if (pathnames.includes("reports")) breadcrumb = "Financial Reports";
  else if (pathnames.includes("payments")) breadcrumb = "Payments Ledger";

  // Derive user info
  const rawEmail = user?.email || "admin@chitledger.com";
  const rawName = user?.user_metadata?.name || rawEmail.split("@")[0];
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const handleLanguageChange = (newLang: string) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    i18n.changeLanguage(newLang);
    setIsLangOpen(false);
    // Custom window event to notify other components of language switches
    window.dispatchEvent(new Event("languagechange"));
  };

  return (
    <>
      {/* Backdrop trigger layers for click-outside-to-close */}
      {(isLangOpen || isNotifOpen) && (
        <div 
          className="fixed inset-0 z-20 bg-transparent" 
          onClick={() => {
            setIsLangOpen(false);
            setIsNotifOpen(false);
          }}
        />
      )}

      <header className="fixed top-0 right-0 left-0 z-30 h-16 bg-milk border-b border-plum/20 flex items-center justify-between px-6 md:px-10 transition-all duration-200 shadow-plum-sm">
        {/* Page Breadcrumb Title */}
        <div className="flex items-center gap-4 ml-12 md:ml-[280px]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-plum/60 uppercase tracking-wider select-none">ChitLedger</span>
            <span className="text-plum/30 text-sm">/</span>
            <span className="text-sm font-extrabold text-plum">{breadcrumb}</span>
          </div>
        </div>
        
        {/* Right User Actions */}
        <div className="flex items-center gap-3.5 relative">
          
          {/* Language Selector Dropdown trigger */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsLangOpen(!isLangOpen);
                setIsNotifOpen(false);
              }}
              className={`p-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 cursor-pointer relative ${
                isLangOpen ? "bg-plum text-milk" : "hover:bg-plum/10 text-plum"
              }`} 
              aria-label="Language options"
            >
              <Globe className="w-[18px] h-[18px]" />
            </button>

            {/* Language Popover Menu */}
            {isLangOpen && (
              <div className="absolute right-0 mt-2.5 w-44 rounded-lg bg-milk border border-plum/20 shadow-plum-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-plum font-bold text-xs">
                <button
                  onClick={() => handleLanguageChange("en")}
                  className="w-full px-4 py-2 hover:bg-plum/5 text-left flex items-center justify-between cursor-pointer"
                >
                  <span>English (US)</span>
                  {lang === "en" && <Check className="w-3.5 h-3.5 text-plum" />}
                </button>
                <button
                  onClick={() => handleLanguageChange("te")}
                  className="w-full px-4 py-2 hover:bg-plum/5 text-left flex items-center justify-between cursor-pointer"
                >
                  <span>తెలుగు (Telugu)</span>
                  {lang === "te" && <Check className="w-3.5 h-3.5 text-plum" />}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Button & Tray */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsLangOpen(false);
              }}
              className={`p-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 cursor-pointer relative ${
                isNotifOpen ? "bg-plum text-milk" : "hover:bg-plum/10 text-plum"
              }`} 
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-plum rounded-full ring-2 ring-milk"></span>
              )}
            </button>

            {/* Notifications Popover Drawer */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 rounded-lg bg-milk border border-plum/20 shadow-plum-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-plum">
                <div className="px-4 py-3.5 bg-plum text-milk border-b border-plum/10 flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider">System Alerts</span>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 bg-milk text-plum rounded-lg text-[9px] font-bold uppercase select-none">
                      {pendingCount} Actions
                    </span>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-plum/10 bg-milk">
                  {loadingNotifs ? (
                    <div className="py-8 flex justify-center items-center">
                      <Loader2 className="w-5 h-5 animate-spin text-plum" />
                    </div>
                  ) : pendingCount === 0 ? (
                    <div className="py-8 px-4 text-center text-plum/50 space-y-1.5 select-none">
                      <CheckCircle2 className="w-8 h-8 text-plum mx-auto opacity-40" />
                      <p className="text-xs font-bold">All Systems Clear</p>
                      <p className="text-[10px] text-plum/60">No pending collections or action requirements.</p>
                    </div>
                  ) : (
                    <>
                      {/* Live Dues Alert */}
                      <div 
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate("/pending");
                        }}
                        className="p-3.5 flex items-start gap-3 hover:bg-plum/5 transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-plum shrink-0 mt-0.5" />
                        <div className="text-left space-y-0.5">
                          <p className="text-xs font-bold text-plum leading-snug">Outstanding Installments Due</p>
                          <p className="text-[10px] text-plum/60 leading-normal">
                            There are {pendingCount} member collections overdue. Verify ledgers to send WhatsApp alerts.
                          </p>
                        </div>
                      </div>

                      {/* Mock Notification 1: Audit Completed */}
                      <div 
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate("/payments");
                        }}
                        className="p-3.5 flex items-start gap-3 hover:bg-plum/5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-plum shrink-0 mt-0.5" />
                        <div className="text-left space-y-0.5">
                          <p className="text-xs font-bold text-plum leading-snug">Weekly Ledger Check Complete</p>
                          <p className="text-[10px] text-plum/60 leading-normal">
                            All database indexes and receipt counters compiled without errors.
                          </p>
                        </div>
                      </div>

                      {/* Mock Notification 2: Settings check */}
                      <div 
                        onClick={() => {
                          setIsNotifOpen(false);
                          navigate("/settings");
                        }}
                        className="p-3.5 flex items-start gap-3 hover:bg-plum/5 transition-colors cursor-pointer"
                      >
                        <Info className="w-4 h-4 text-plum shrink-0 mt-0.5" />
                        <div className="text-left space-y-0.5">
                          <p className="text-xs font-bold text-plum leading-snug">Settings Parameters Synced</p>
                          <p className="text-[10px] text-plum/60 leading-normal">
                            SMS templates and corporate naming parameters have been cached locally.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-2 border-t border-plum/10 bg-plum/5 text-center">
                  <button 
                    onClick={() => {
                      setIsNotifOpen(false);
                      navigate("/pending");
                    }}
                    className="text-[10px] font-bold text-plum hover:underline cursor-pointer py-1"
                  >
                    View All Reminders
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-plum/25 select-none" />

          {/* Dynamic User Profile indicator */}
          <div className="flex items-center gap-2.5 pl-1 group p-1.5 rounded-lg border border-transparent hover:bg-plum/5 hover:border-plum/10 active:scale-[0.98] transition-all duration-200 select-none">
            <div className="w-8 h-8 rounded-lg bg-milk border border-plum/20 flex items-center justify-center text-plum group-hover:bg-plum/10 transition-colors">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-plum leading-none">{displayName}</p>
              <p className="text-[10px] text-plum/60 mt-0.5 leading-none font-semibold">{rawEmail}</p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
