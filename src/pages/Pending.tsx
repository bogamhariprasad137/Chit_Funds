import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/formatCurrency";
import { Loader2, Search, Send, CreditCard, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { RecordPaymentModal } from "@/components/shared/RecordPaymentModal";

export function Pending() {
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentContext, setSelectedPaymentContext] = useState<{memberId: string, groupId: string, month: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dashboard Stats
  const [totalPending, setTotalPending] = useState(0);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pending_installments_view')
      .select('*')
      .order('total_due', { ascending: false });

    if (!error && data) {
      setPendingPayments(data);
      const total = data.reduce((sum, p) => sum + (p.total_due || 0), 0);
      setTotalPending(total);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSendReminder = async (payment: any) => {
    try {
      if (!payment.installment_month) {
        alert("Reminder failed: Installment month is missing.");
        return;
      }

      // 1. Fetch Member Details
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('name, phone')
        .eq('id', payment.member_id)
        .single();

      if (memberError || !member) {
        alert("Reminder failed: Could not fetch member details.");
        return;
      }

      if (!member.phone) {
        alert(`Reminder failed: ${member.name} does not have a phone number registered.`);
        return;
      }

      // 2. Fetch Group Details (for Monthly Installment)
      const { data: group, error: groupError } = await supabase
        .from('chit_groups')
        .select('installment_amount')
        .eq('id', payment.group_id)
        .single();

      if (groupError || !group) {
        alert("Reminder failed: Could not fetch chit group details.");
        return;
      }

      // 3. Format month name
      let monthName = "";
      try {
        const d = new Date(payment.installment_month);
        if (!isNaN(d.getTime())) {
          monthName = d.toLocaleDateString("en-US", { month: "long" }); // e.g., "July"
        }
      } catch (err) {
        console.error(err);
      }

      if (!monthName) {
        alert("Reminder failed: Invalid installment month value.");
        return;
      }

      // 4. Construct Telugu message
      const paymentAmountStr = formatCurrency(group.installment_amount);
      const textMessage = `ముందుగా చిట్టి సభ్యులందరికీ నమస్కారములు\n\nఈ ${monthName} చిట్టి పేమెంటు ${paymentAmountStr}\n\nసకాలంలో చిట్టి డబ్బులు చెల్లించండి🙏`;

      // 5. Open WhatsApp
      const formattedPhone = member.phone.replace(/\D/g, ""); // strip non-digits
      const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textMessage)}`;
      window.open(url, "_blank");
    } catch (err: any) {
      console.error(err);
      alert("An unexpected error occurred while sending the reminder.");
    }
  };

  const handleRecordPayment = (payment: any) => {
    setSelectedPaymentContext({
      memberId: payment.member_id,
      groupId: payment.group_id,
      month: payment.installment_month
    });
    setIsPaymentModalOpen(true);
  };

  const filteredPending = pendingPayments.filter((p) =>
    p.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 bg-milk text-plum font-body-md">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum tracking-tight">Pending Collections</h1>
          <p className="text-sm font-medium text-plum/60 mt-1 font-outfit">Audit and record outstanding chit pool dues.</p>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Total Outstanding */}
        <div className="card-milk p-6 flex items-center justify-between cursor-pointer" onClick={() => setSearchQuery("")}>
          <div>
            <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1 font-geist">Pending Amount</p>
            <h3 className="text-2xl font-black text-plum font-mono tracking-tight">{formatCurrency(totalPending)}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-plum flex items-center justify-center text-milk border border-milk/10 shadow-milk-sm">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Overdue Accounts */}
        <div className="card-milk p-6 flex items-center justify-between cursor-pointer" onClick={() => setSearchQuery("")}>
          <div>
            <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1 font-geist">Overdue Accounts</p>
            <h3 className="text-2xl font-black text-plum tracking-tight">{pendingPayments.length} Accounts</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-plum flex items-center justify-center text-milk border border-milk/10 shadow-milk-sm">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-4 bg-milk p-4 border border-plum/20 rounded-lg shadow-plum-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm input-milk shadow-plum-sm" 
            placeholder="Search by member or group name..." 
            type="text"
          />
        </div>
        
        <span className="text-xs font-bold text-plum bg-milk border border-plum/25 px-3 py-1 rounded-lg uppercase tracking-wider hidden sm:inline-block select-none">
          {filteredPending.length} due installment{filteredPending.length !== 1 ? 's' : ''} shown
        </span>
      </div>

      {/* Main Ledger Table Card */}
      <section className="card-milk overflow-hidden hover:-translate-y-0.5 min-h-[300px]">
        <div className="px-6 py-4 bg-plum text-milk border-b border-plum/20">
          <h4 className="text-sm font-bold">Action Required Queue</h4>
        </div>
        
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-plum" />
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-14 h-14 bg-plum/5 border border-plum/15 rounded-lg flex items-center justify-center mb-4 text-plum shadow-plum-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-plum mb-1">Collections Reconciled</h3>
            <p className="text-xs text-plum/60">All active schemes are fully paid up for this period.</p>
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <h3 className="text-base font-bold text-plum mb-1">No Match Found</h3>
            <p className="text-xs text-plum/60">Your search query did not match any outstanding items.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-plum text-milk border-b border-plum/20">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Member</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Group</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Installment Period</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Penalty Fee</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Total Outstanding</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Auditing Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {filteredPending.map((payment, i) => (
                  <tr key={i} className="hover:bg-plum hover:text-milk transition-all duration-200 ease-in-out cursor-pointer group active:bg-plum/95">
                    {/* Name/Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-plum text-milk border border-milk/10 flex items-center justify-center font-bold shadow-plum-sm group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 transition-colors duration-200 uppercase text-xs">
                          {payment.member_name.substring(0, 2)}
                        </div>
                        <span className="text-sm font-bold">{payment.member_name}</span>
                      </div>
                    </td>
                    {/* Group */}
                    <td className="px-6 py-4 text-xs font-bold text-plum/70 group-hover:text-milk/70">{payment.group_name}</td>
                    {/* Period */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-plum/5 border border-plum/25 rounded-lg text-[10px] font-bold font-mono text-plum uppercase group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 transition-all duration-200">
                        {new Date(payment.installment_month).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}
                      </span>
                    </td>
                    {/* Penalty */}
                    <td className="px-6 py-4 font-mono text-xs text-right font-bold">
                      {payment.penalty_amount > 0 ? formatCurrency(payment.penalty_amount) : "—"}
                    </td>
                    {/* Total Outstanding */}
                    <td className="px-6 py-4 font-mono font-black text-sm text-right">
                      {formatCurrency(payment.total_due)}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleSendReminder(payment)}
                          className="btn-milk px-3.5 py-2 flex items-center gap-1.5 active:scale-95 group-hover:bg-milk group-hover:text-plum font-bold tracking-wider"
                        >
                          <Send className="w-3 h-3" />
                          Remind
                        </button>
                        <button 
                          onClick={() => handleRecordPayment(payment)}
                          className="btn-plum px-4 py-2 flex items-center gap-1.5 active:scale-95 group-hover:bg-milk group-hover:text-plum group-hover:border-plum/20 font-bold tracking-wider"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Collect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedPaymentContext && (
        <RecordPaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          preselectedMemberId={selectedPaymentContext.memberId}
          preselectedGroupId={selectedPaymentContext.groupId}
          preselectedMonth={selectedPaymentContext.month}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            fetchPending();
          }}
        />
      )}
    </div>
  );
}
