import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { supabase } from "@/lib/supabase";

interface WhatsAppReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberInfo?: {
    name: string;
    groupName: string;
    installment: number;
    penalty: number;
    total: number;
    phone?: string;
  };
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export function WhatsAppReminderModal({
  open,
  onOpenChange,
  memberInfo = {
    name: "Rajesh Kumar",
    groupName: "Alpha Fund 2023",
    installment: 25000,
    penalty: 500,
    total: 25500,
    phone: "919876543210"
  }
}: WhatsAppReminderModalProps) {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [templateEn, setTemplateEn] = useState("");
  const [templateTe, setTemplateTe] = useState("");

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  async function fetchTemplates() {
    setLoading(true);
    const { data } = await supabase
      .from('admin_settings')
      .select('whatsapp_template_en, whatsapp_template_te')
      .eq('id', SETTINGS_ID)
      .single();
      
    if (data) {
      setTemplateEn(data.whatsapp_template_en || "Hello {member_name}, your chit installment {installment} for {chit_name} is due. Total with penalty: {total}.");
      setTemplateTe(data.whatsapp_template_te || "నమస్తే {member_name}, మీ చిట్ వాయిదా {installment} కు {chit_name} గడువు ముగిసింది. మొత్తం చెల్లించాల్సిన: {total}.");
    }
    setLoading(false);
  }

  const getPopulatedMessage = () => {
    const rawTemplate = i18n.language === 'te' ? templateTe : templateEn;
    
    return rawTemplate
      .replace(/{member_name}/g, memberInfo.name)
      .replace(/{chit_name}/g, memberInfo.groupName)
      .replace(/{month}/g, format(new Date(), "MMMM"))
      .replace(/{installment}/g, formatCurrency(memberInfo.installment))
      .replace(/{penalty}/g, formatCurrency(memberInfo.penalty))
      .replace(/{total}/g, formatCurrency(memberInfo.total));
  };

  const message = getPopulatedMessage();

  const handleSend = () => {
    const phone = (memberInfo.phone || "").replace(/\D/g, ""); // strip non-digits
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 bg-white rounded-2xl gap-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 display-font">
            Preview Reminder
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center min-h-[160px]">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-[#EFEAE2] p-4 rounded-xl relative min-h-[160px] flex flex-col justify-end">
            <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[90%] self-start relative">
              <p className="text-slate-900 text-base leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
              <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-400">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-slate-300 text-slate-900 font-semibold"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSend}
            disabled={loading || !message}
            className="bg-[#10b981] hover:bg-[#059669] text-white font-semibold gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            Send via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
