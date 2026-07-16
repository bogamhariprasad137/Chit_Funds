import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button 
      onClick={onClick}
      className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center hover:bg-slate-800 transition-transform active:scale-95 z-40"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}
