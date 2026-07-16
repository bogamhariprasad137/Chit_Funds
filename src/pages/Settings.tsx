import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe, MessageCircle, Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export function Settings() {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateEn, setTemplateEn] = useState("");
  const [templateTe, setTemplateTe] = useState("");

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_settings')
        .select('whatsapp_template_en, whatsapp_template_te')
        .eq('id', SETTINGS_ID)
        .single();
        
      if (data) {
        setTemplateEn(data.whatsapp_template_en || "");
        setTemplateTe(data.whatsapp_template_te || "");
      } else if (error) {
        console.error("Failed to load settings:", error);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('admin_settings')
      .update({
        whatsapp_template_en: templateEn,
        whatsapp_template_te: templateTe
      })
      .eq('id', SETTINGS_ID);

    if (error) {
      alert("Failed to save settings: " + error.message);
    } else {
      alert("Settings saved successfully.");
    }
    setSaving(false);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 display-font tracking-tight">
            Settings
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage application preferences and WhatsApp integration.</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Localization Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Localization</h2>
            </div>
            <p className="text-sm text-slate-500">Select the primary language for receipts and WhatsApp templates.</p>
          </div>
          <div className="p-6 bg-slate-50">
            <div className="max-w-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Primary Language
              </label>
              <select 
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="te">Telugu</option>
              </select>
            </div>
          </div>
        </div>

        {/* WhatsApp Integration Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">WhatsApp Templates</h2>
            </div>
            <p className="text-sm text-slate-500">Configure the deep link message templates. Available tokens: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">{'{member_name}'}</code> <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">{'{chit_name}'}</code> <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">{'{month}'}</code> <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">{'{installment}'}</code> <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">{'{penalty}'}</code> <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">{'{total}'}</code></p>
          </div>
          <div className="p-6 bg-slate-50 space-y-6">
            
            {loading ? (
              <div className="flex justify-center p-6"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    English Template
                  </label>
                  <textarea 
                    value={templateEn}
                    onChange={e => setTemplateEn(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-mono"
                    placeholder="Hello {member_name}, your chit installment..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Telugu Template
                  </label>
                  <textarea 
                    value={templateTe}
                    onChange={e => setTemplateTe(e.target.value)}
                    rows={4}
                    className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all font-mono"
                    placeholder="నమస్తే {member_name}, మీ చిట్ వాయిదా..."
                  />
                </div>
              </>
            )}

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving || loading} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
