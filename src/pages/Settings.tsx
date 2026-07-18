import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Settings as SettingsIcon, MessageSquare, Landmark, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const { t } = useTranslation();

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from('admin_settings').select('*').single();
      if (data) {
        setSettings(data);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    setMessage({ text: "", type: "" });
    
    const { error } = await supabase
      .from('admin_settings')
      .update({
        business_name: settings.business_name,
        whatsapp_template_en: settings.whatsapp_template_en,
        whatsapp_template_te: settings.whatsapp_template_te
      })
      .eq('id', settings.id);

    if (error) {
      setMessage({ text: "Failed to save settings parameters. Please try again.", type: "error" });
    } else {
      setMessage({ text: "Global settings parameters saved successfully.", type: "success" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-milk text-plum">
        <Loader2 className="w-8 h-8 animate-spin text-plum" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 bg-milk text-plum font-body-md">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum tracking-tight">{t("settings.title")}</h1>
          <p className="text-sm font-medium text-plum/60 mt-1 font-outfit">{t("settings.description")}</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="card-milk overflow-hidden hover:-translate-y-0.5">
          <div className="px-6 py-4 bg-plum text-milk border-b border-plum/20 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            <h3 className="text-sm font-bold">{t("settings.card_title")}</h3>
          </div>
          
          <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
            
            {/* Status Feedback Banners */}
            {message.text && (
              <div className="p-4 rounded-lg flex items-start gap-3 border bg-plum text-milk border-milk/10 animate-in fade-in duration-200 shadow-milk-sm">
                {message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <p className="text-xs font-bold leading-normal">{message.text}</p>
              </div>
            )}

            {/* Business Naming Parameter */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 opacity-60" />
                <label className="text-xs font-bold uppercase tracking-wider block">{t("settings.business_label")}</label>
              </div>
              <input 
                type="text" 
                value={settings?.business_name || ""}
                onChange={(e) => setSettings({...settings, business_name: e.target.value})}
                required
                className="w-full px-3.5 py-2.5 input-milk shadow-plum-sm"
              />
              <p className="text-[10px] opacity-75 mt-1 font-bold select-none">{t("settings.business_desc")}</p>
            </div>

            {/* WhatsApp Template Parameter (English) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 opacity-60" />
                <label className="text-xs font-bold uppercase tracking-wider block">{t("settings.english_template")}</label>
              </div>
              <textarea 
                value={settings?.whatsapp_template_en || ""}
                onChange={(e) => setSettings({...settings, whatsapp_template_en: e.target.value})}
                required
                rows={3}
                className="w-full px-3.5 py-2.5 input-milk shadow-plum-sm resize-none text-xs"
              />
            </div>

            {/* WhatsApp Template Parameter (Telugu) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 opacity-60" />
                <label className="text-xs font-bold uppercase tracking-wider block">{t("settings.telugu_template")}</label>
              </div>
              <textarea 
                value={settings?.whatsapp_template_te || ""}
                onChange={(e) => setSettings({...settings, whatsapp_template_te: e.target.value})}
                required
                rows={3}
                className="w-full px-3.5 py-2.5 input-milk shadow-plum-sm resize-none text-xs"
              />
              
              {/* Variable placeholders legend */}
              <div className="bg-plum/5 border border-plum/20 p-4 rounded-lg space-y-2 mt-2 hover:shadow-plum-sm transition-all duration-200 ease-in-out">
                <p className="text-[10px] font-bold uppercase tracking-wider select-none">{t("settings.legend_title")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] leading-normal font-bold">
                  <div className="flex items-center">
                    <code className="bg-plum text-milk px-1.5 py-0.5 rounded font-mono font-bold mr-1.5 select-all">{"{member_name}"}</code>
                    Recipient Name
                  </div>
                  <div className="flex items-center">
                    <code className="bg-plum text-milk px-1.5 py-0.5 rounded font-mono font-bold mr-1.5 select-all">{"{total_due}"}</code>
                    Outstanding Amount
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action with Hover Inversion */}
            <div className="flex items-center justify-end pt-4 border-t border-plum/10">
              <button
                type="submit"
                disabled={saving}
                className="btn-plum px-5 py-3 shadow-plum-sm disabled:opacity-50"
              >
                {saving ? t("settings.saving_btn") : t("settings.save_btn")}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
