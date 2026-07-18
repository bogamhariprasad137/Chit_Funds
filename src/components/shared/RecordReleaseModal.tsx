import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, X, Landmark, User, Coins, CreditCard, MessageSquare, Calendar } from "lucide-react";

interface RecordReleaseModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSuccess: () => void;
  preselectedGroupId?: string;
}

export function RecordReleaseModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  onSuccess,
  preselectedGroupId,
}: RecordReleaseModalProps) {
  const visible = open !== undefined ? open : (isOpen || false);

  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groupId, setGroupId] = useState(preselectedGroupId || "");
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [releaseMonth, setReleaseMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "bank_transfer">("bank_transfer");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (visible) {
      const loadOptions = async () => {
        const { data: groupsData } = await supabase.from("chit_groups").select("*").eq("status", "active");
        const { data: membersData } = await supabase.from("members").select("*");
        
        if (groupsData) setGroups(groupsData);
        if (membersData) setMembers(membersData);
        
        if (preselectedGroupId) setGroupId(preselectedGroupId);
      };
      
      loadOptions();
      setError(null);
      setMemberId("");
      setAmount("");
      setRemarks("");
      setReleaseMonth(new Date().toISOString().substring(0, 7));
      setPaymentMode("bank_transfer");
    }
  }, [visible, preselectedGroupId]);

  if (!visible) return null;

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const filteredMembers = members.filter((m) => m.group_id === groupId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!groupId) throw new Error("Please select a chit group.");
      if (!memberId) throw new Error("Please select a winning member.");
      if (!amount || Number(amount) <= 0) throw new Error("Please enter a valid payout amount.");
      if (!releaseMonth) throw new Error("Please select a release month.");

      // Insert record
      const { error: insertError } = await supabase.from("chit_releases").insert({
        group_id: groupId,
        member_id: memberId,
        amount: Number(amount),
        release_month: `${releaseMonth}-01T00:00:00.000Z`, // Store as timestamp
        payment_mode: paymentMode,
        remarks: remarks.trim() || null,
        released_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Error recording release:", err);
      setError(err.message || "Failed to record payout release.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-plum/40 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal card */}
      <div className="bg-milk w-full max-w-[480px] rounded-lg shadow-plum-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-250 relative z-10 overflow-hidden border border-plum/20 text-plum font-body-md">
        
        {/* Header */}
        <div className="px-6 py-5 bg-plum text-milk border-b border-milk/10 flex justify-between items-center">
          <div>
            <h3 className="text-base font-extrabold text-milk">Record Prize Release</h3>
            <p className="text-[10px] text-milk/60 mt-0.5 font-bold font-geist">Disburse chit funds to auction winners</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 hover:bg-milk/10 rounded-lg text-milk/80 hover:text-milk transition-all duration-200 active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="bg-plum text-milk text-xs font-bold p-4 rounded-lg border border-milk/10 shadow-milk-sm">
              {error}
            </div>
          )}

          {/* Group selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Chit Group</label>
            <div className="relative">
              <Landmark className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 pointer-events-none" />
              <select
                required
                disabled={!!preselectedGroupId}
                value={groupId}
                onChange={(e) => {
                  setGroupId(e.target.value);
                  setMemberId("");
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk disabled:bg-plum/5 disabled:text-plum/70 shadow-plum-sm appearance-none cursor-pointer"
              >
                <option value="">Select a chit group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Member selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Auction Winner Member</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 pointer-events-none" />
              <select
                required
                disabled={!groupId}
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk disabled:bg-plum/5 disabled:text-plum/70 shadow-plum-sm appearance-none cursor-pointer"
              >
                <option value="">Select winner</option>
                {filteredMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Release Month input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Auction Month</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 pointer-events-none" />
              <input
                type="month"
                required
                value={releaseMonth}
                onChange={(e) => setReleaseMonth(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk shadow-plum-sm font-mono"
              />
            </div>
          </div>

          {/* Payout amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Prize Amount Released (₹)</label>
            <div className="relative group">
              <Coins className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk shadow-plum-sm font-mono placeholder:text-plum/40"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Disbursement Mode</label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 pointer-events-none" />
              <select
                required
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as "cash" | "upi" | "bank_transfer")}
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
            <label className="text-[10px] font-bold uppercase tracking-wider block">Remarks (Optional)</label>
            <div className="relative group">
              <MessageSquare className="w-4 h-4 absolute left-3.5 top-3 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Auction bidding margins or notes..."
                rows={2}
                className="w-full pl-10 pr-4 py-2 text-sm input-milk shadow-plum-sm resize-none placeholder:text-plum/40"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-plum/10">
            <button
              type="button"
              onClick={handleClose}
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
                  Recording...
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                "Release Payout"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
