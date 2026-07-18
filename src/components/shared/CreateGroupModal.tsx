import { useState, useEffect } from "react";
import { Loader2, X, Landmark, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CreateGroupModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onGroupCreated?: () => void;
  onSuccess?: () => void;
}

export function CreateGroupModal({
  isOpen,
  open,
  onClose,
  onOpenChange,
  onGroupCreated,
  onSuccess,
}: CreateGroupModalProps) {
  const visible = open !== undefined ? open : (isOpen || false);

  const [name, setName] = useState("");
  const [chitAmount, setChitAmount] = useState(500000);
  const [durationMonths, setDurationMonths] = useState(20);
  const [installmentAmount, setInstallmentAmount] = useState(25000);
  const [monthlyPenaltyRate, setMonthlyPenaltyRate] = useState(2.0);
  const [gracePeriodDays, setGracePeriodDays] = useState(5);
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [penaltyCalculationMode, setPenaltyCalculationMode] = useState("linear_escalating");
  const [maxMembers, setMaxMembers] = useState(30);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName("");
      setChitAmount(500000);
      setDurationMonths(20);
      setInstallmentAmount(25000);
      setMonthlyPenaltyRate(2.0);
      setGracePeriodDays(5);
      setStartDate(new Date().toISOString().substring(0, 10));
      setPenaltyCalculationMode("linear_escalating");
      setMaxMembers(30);
      setError(null);
    }
  }, [visible]);

  if (!visible) return null;

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const triggerSuccess = () => {
    if (onSuccess) onSuccess();
    if (onGroupCreated) onGroupCreated();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!name || name.trim().length < 3) {
        throw new Error("Group name must be at least 3 characters long.");
      }
      if (chitAmount < 1000) {
        throw new Error("Chit pool value must be at least ₹1,000.");
      }
      if (durationMonths < 1) {
        throw new Error("Scheme duration must be at least 1 month.");
      }
      if (installmentAmount < 100) {
        throw new Error("Monthly installment must be at least ₹100.");
      }

      const { error: insertError } = await supabase.from("chit_groups").insert({
        name: name.trim(),
        chit_amount: Number(chitAmount),
        duration_months: Number(durationMonths),
        installment_amount: Number(installmentAmount),
        monthly_penalty_rate: Number(monthlyPenaltyRate),
        grace_period_days: Number(gracePeriodDays),
        start_date: new Date(startDate).toISOString(),
        penalty_calculation_mode: penaltyCalculationMode as any,
        max_members: Number(maxMembers),
        status: "active",
      });

      if (insertError) throw insertError;

      triggerSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Error creating group:", err);
      setError(err.message || "Failed to create new chit group in database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-plum/40 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal card */}
      <div className="bg-milk w-full max-w-[540px] rounded-lg shadow-plum-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-250 relative z-10 overflow-hidden border border-plum/20 max-h-[92vh] flex flex-col text-plum font-body-md">
        
        {/* Header */}
        <div className="px-6 py-5 bg-plum text-milk border-b border-milk/10 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-milk">Create Chit Scheme</h3>
            <p className="text-[10px] text-milk/60 mt-0.5 font-bold font-geist">Initialize a new financial pool parameter set.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 hover:bg-milk/10 rounded-lg text-milk/80 hover:text-milk transition-all duration-200 active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {error && (
            <div className="bg-plum text-milk text-xs font-bold p-4 rounded-lg border border-milk/10 shadow-milk-sm">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block">Group Identifier Name</label>
            <div className="relative group">
              <Landmark className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alpha Fund 2023"
                className="w-full pl-10 pr-4 py-2.5 text-sm input-milk placeholder:text-plum/40"
              />
            </div>
          </div>

          {/* Grid inputs */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Chit Pool Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block">Chit Value (₹)</label>
              <input
                type="number"
                required
                value={chitAmount}
                onChange={(e) => setChitAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm input-milk font-mono"
              />
            </div>

            {/* Installment Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block">Installment (₹)</label>
              <input
                type="number"
                required
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm input-milk font-mono"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block">Duration (Months)</label>
              <input
                type="number"
                required
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm input-milk font-mono"
              />
            </div>

            {/* Max Members */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block">Max Enrollment Cap</label>
              <input
                type="number"
                required
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm input-milk font-mono"
              />
            </div>

            {/* Penalty rate */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block">Monthly Penalty (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={monthlyPenaltyRate}
                onChange={(e) => setMonthlyPenaltyRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm input-milk font-mono"
              />
            </div>

            {/* Grace period */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block">Grace Period (Days)</label>
              <input
                type="number"
                required
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm input-milk font-mono"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block">Launch Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm input-milk font-mono"
              />
            </div>

            {/* Calculation Mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block">Penalty Equation</label>
              <select
                value={penaltyCalculationMode}
                onChange={(e) => setPenaltyCalculationMode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm input-milk appearance-none cursor-pointer"
              >
                <option value="linear_escalating">Linear Escalating Mode</option>
                <option value="flat_per_month">Flat Per Month Mode</option>
              </select>
            </div>

          </div>

          <div className="flex gap-2 p-3.5 bg-plum/5 border border-plum/15 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-plum shrink-0 mt-0.5" />
            <p className="text-[10px] leading-normal font-bold">
              Once initialized, total value, launch date, and duration variables are protected and frozen to maintain transaction consistency.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-plum/10 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 btn-milk"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 btn-plum flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  Creating Fund...
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              ) : (
                "Initialize Group"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
