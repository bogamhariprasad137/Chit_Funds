import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, Landmark, User, Coins, CreditCard, Calendar, MessageSquare, AlertCircle } from "lucide-react";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
  preselectedGroupId?: string;
  preselectedMonth?: string;
  onSuccess: () => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  preselectedMemberId,
  preselectedGroupId,
  preselectedMonth,
  onSuccess,
}: RecordPaymentModalProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [installmentMonth, setInstallmentMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [remarks, setRemarks] = useState("");

  // Advanced Penalty Override
  const [penaltyOverride, setPenaltyOverride] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  // Load initial dropdown options
  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        const { data: membersData } = await supabase.from("members").select("*").order("name");
        const { data: groupsData } = await supabase.from("chit_groups").select("*").order("name");
        
        if (membersData) setMembers(membersData);
        if (groupsData) setGroups(groupsData);
        
        setMemberId(preselectedMemberId || "");
        setGroupId(preselectedGroupId || "");
        setInstallmentMonth(preselectedMonth ? preselectedMonth.substring(0, 7) : new Date().toISOString().substring(0, 7));
      };
      
      loadOptions();
      setError(null);
      setAmount("");
      setRemarks("");
      setPenaltyOverride("");
      setOverrideReason("");
    }
  }, [isOpen, preselectedMemberId, preselectedGroupId, preselectedMonth]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!memberId) throw new Error("Please select a member.");
      if (!groupId) throw new Error("Please select a chit group.");
      if (!installmentMonth) throw new Error("Please select the installment period month.");
      if (!amount || Number(amount) <= 0) throw new Error("Please enter a valid amount.");

      // Formulate YYYY-MM-01 format for database date type
      const monthDate = `${installmentMonth}-01`;

      // Check penalty override validation
      if (penaltyOverride !== "" && Number(penaltyOverride) >= 0 && !overrideReason.trim()) {
        throw new Error("An override reason is mandatory when custom penalty is set.");
      }

      // Call database procedure
      const { error: rpcError } = await supabase.rpc("record_payment", {
        p_member_id: memberId,
        p_installment_month: monthDate,
        p_payment_mode: paymentMode.toLowerCase() as any,
        p_amount_paid: Number(amount),
        p_remarks: remarks.trim() || undefined,
        p_penalty_override: penaltyOverride !== "" ? Number(penaltyOverride) : undefined,
        p_override_reason: overrideReason.trim() || undefined,
      });

      if (rpcError) {
        if (rpcError.message.includes("Partial payments not allowed") || rpcError.message.includes("Payment validation failed")) {
          throw new Error("Payment validation failed. Amount paid must exactly match the sum of installment amount and penalty.");
        }
        throw rpcError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error recording payment:", err);
      setError(err.message || "Failed to record payment in the database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Overlay Backdrop */}
      <div className="absolute inset-0 bg-plum/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="bg-milk w-full max-w-[500px] rounded-lg shadow-plum-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-250 relative z-10 overflow-hidden border border-plum/20 text-plum max-h-[92vh] flex flex-col font-body-md">
        
        {/* Header */}
        <div className="px-6 py-5 bg-plum text-milk border-b border-milk/10 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-milk">Record Installment Payment</h3>
            <p className="text-[10px] text-milk/60 mt-0.5 font-bold font-geist">Register a new contribution transaction</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-milk/10 rounded-lg text-milk/80 hover:text-milk transition-all duration-200 active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {error && (
            <div className="bg-plum text-milk text-xs font-bold p-4 rounded-lg border border-milk/10 shadow-milk-sm animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Member selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block font-outfit">Select Member</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 pointer-events-none" />
              <select
                required
                disabled={!!preselectedMemberId}
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk disabled:bg-plum/5 disabled:text-plum/70 shadow-plum-sm appearance-none cursor-pointer"
              >
                <option value="">Select a member profile</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Group selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block font-outfit">Assigned Chit Group</label>
            <div className="relative">
              <Landmark className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 pointer-events-none" />
              <select
                required
                disabled={!!preselectedGroupId}
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk disabled:bg-plum/5 disabled:text-plum/70 shadow-plum-sm appearance-none cursor-pointer"
              >
                <option value="">Select a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Installment Month Period */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block font-outfit">Installment Month</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 pointer-events-none" />
              <input
                type="month"
                required
                disabled={!!preselectedMonth}
                value={installmentMonth}
                onChange={(e) => setInstallmentMonth(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk disabled:bg-plum/5 disabled:text-plum/70 shadow-plum-sm font-mono cursor-pointer"
              />
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block font-outfit">Total Amount Paid (₹)</label>
            <div className="relative group">
              <Coins className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk shadow-plum-sm placeholder:text-plum/40 font-mono"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block font-outfit">Payment Mode</label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 pointer-events-none" />
              <select
                required
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk shadow-plum-sm appearance-none cursor-pointer"
              >
                <option value="cash">CASH</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">BANK TRANSFER</option>
              </select>
            </div>
          </div>

          {/* Remarks input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block font-outfit">Remarks (Optional)</label>
            <div className="relative group">
              <MessageSquare className="w-4 h-4 absolute left-3.5 top-3 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reference numbers or transaction notes..."
                rows={2}
                className="w-full pl-10 pr-4 py-2 text-sm input-milk shadow-plum-sm resize-none placeholder:text-plum/40"
              />
            </div>
          </div>

          {/* Advanced Penalty Override Box */}
          <div className="bg-plum/5 border border-plum/15 p-4 rounded-lg space-y-3 mt-4 hover:shadow-plum-sm transition-all duration-200">
            <h4 className="text-xs font-bold text-plum uppercase tracking-wider">Penalty Override (Advanced)</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Override Amount */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider block text-plum/70">Custom Penalty Fee</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={penaltyOverride}
                  onChange={(e) => setPenaltyOverride(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs input-milk font-mono"
                />
              </div>

              {/* Override Reason */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider block text-plum/70">Reason for Override</label>
                <input
                  type="text"
                  placeholder="e.g. Waived by admin"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs input-milk"
                />
              </div>
            </div>
            
            {penaltyOverride !== "" && (
              <div className="flex gap-1.5 items-start text-[9px] font-bold text-plum/80 leading-normal animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Notice: Reason is required. Total collected must equal installment + Custom Penalty.</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-plum/10 shrink-0">
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
              disabled={loading}
              className="px-4 py-2 btn-plum flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  Processing...
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                "Record Payment"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
