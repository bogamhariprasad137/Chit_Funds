import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, X, AlertTriangle, AlertCircle } from "lucide-react";

interface VoidPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  receiptNumber: string;
  onSuccess: () => void;
}

export function VoidPaymentModal({
  isOpen,
  onClose,
  paymentId,
  receiptNumber,
  onSuccess,
}: VoidPaymentModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) return;

    setLoading(true);
    setError(null);

    try {
      const { error: rpcError } = await supabase.rpc("void_payment", {
        p_payment_id: paymentId,
        p_void_reason: reason.trim(),
      });

      if (rpcError) {
        throw new Error(rpcError.message || "Failed to void payment.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-plum/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="bg-milk w-full max-w-[460px] rounded-lg shadow-plum-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-250 relative z-10 overflow-hidden border border-plum/20 text-plum font-body-md">
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-milk/10 bg-plum text-milk">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <h3 className="text-base font-extrabold text-milk">Void Transaction</h3>
              <p className="text-[10px] text-milk/60 mt-0.5 font-bold font-geist">Auditing override action</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-milk/10 rounded-lg text-milk/80 hover:text-milk transition-all duration-200 active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-plum text-milk text-xs font-bold p-4 rounded-lg border border-milk/10 shadow-milk-sm animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs leading-relaxed">
              Are you sure you want to void Receipt <strong className="font-mono bg-plum/5 border border-plum/25 px-1.5 py-0.5 rounded">{receiptNumber}</strong>?
            </p>
            <div className="flex items-start gap-2.5 p-3.5 bg-plum/5 border border-plum/20 text-plum rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[11px] leading-normal font-bold">
                Warning: This action is permanent and will revert all calculations, installment dues, and penalty metrics associated with this transaction.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">
              Reason for Voiding *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a detailed explanation (minimum 5 characters)..."
              required
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm input-milk shadow-plum-sm resize-none placeholder:text-plum/40"
            />
            <p className="text-[10px] text-plum/55 text-right font-bold select-none">
              {reason.trim().length} / 5 characters minimum
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-plum/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 btn-milk"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 5}
              className="px-4 py-2 btn-plum flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  Voiding...
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                "Void Transaction"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
