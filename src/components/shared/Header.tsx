import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle
} from "@/components/ui/sheet";
import { SidebarNav } from "./Sidebar";
import { useState } from "react";

export function Header({ onOpenPaymentModal }: { onOpenPaymentModal?: () => void }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-10 h-16 bg-white shadow-sm border-b border-slate-200 transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5 text-slate-900" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 pt-16 flex flex-col w-[280px] bg-slate-50 border-r-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex-1 flex flex-col px-4 pb-8 overflow-y-auto">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        
        <span className="font-semibold text-xl text-slate-900 display-font">
          {t('app.title', 'ChitLedger')}
        </span>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        {/* Desktop Record Payment Button */}
        <Button 
          onClick={onOpenPaymentModal}
          className="hidden md:flex bg-slate-900 text-white hover:bg-slate-800"
        >
          Record Payment
        </Button>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLanguage}
            className="flex items-center justify-center h-8 px-3 rounded-full bg-slate-100 text-slate-900 font-medium text-sm hover:bg-slate-200 transition-colors"
          >
            {i18n.language === 'en' ? t('header.toggle_te', 'తెలుగు') : t('header.toggle_en', 'EN')}
          </button>
          
          <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
            AL
          </div>
        </div>
      </div>
    </nav>
  );
}
