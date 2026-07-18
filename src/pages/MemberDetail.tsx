import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/formatCurrency";
import { 
  Loader2, 
  ArrowLeft, 
  Send, 
  Download, 
  Landmark, 
  Coins, 
  AlertCircle,
  FileCheck,
  Ban
} from "lucide-react";
import { RecordPaymentModal } from "@/components/shared/RecordPaymentModal";
import { VoidPaymentModal } from "@/components/payments/VoidPaymentModal";
import { generateReceiptPDF } from "@/lib/pdfGenerator";

export function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentForVoid, setSelectedPaymentForVoid] = useState<any>(null);
  
  // Stats
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  
  // Data lists
  const [payments, setPayments] = useState<any[]>([]);

  const loadMemberData = async () => {
    if (!id) return;
    setLoading(true);

    const { data: memberData } = await supabase
      .from('members')
      .select(`*, chit_groups ( name, chit_amount, duration_months, installment_amount )`)
      .eq('id', id)
      .single();
    
    setMember(memberData);

    if (memberData) {
      // Fetch Payments for this member
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', id)
        .order('paid_at', { ascending: false });

      if (paymentsData) {
        const mapped = paymentsData.map((p: any) => ({
          ...p,
          payment_date: p.paid_at,
          amount: p.total_paid
        }));
        setPayments(mapped);
        
        const paid = mapped.filter(p => !p.voided_at).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        setTotalPaid(paid);
      } else {
        setPayments([]);
        setTotalPaid(0);
      }

      // Fetch Pending for this member
      const { data: pendingData } = await supabase
        .from('pending_installments_view')
        .select('*')
        .eq('member_id', id);

      const pending = pendingData?.reduce((sum, p) => sum + (p.total_due || 0), 0) || 0;
      setTotalPending(pending);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadMemberData();
  }, [id]);

  const handleWhatsAppReminder = async () => {
    if (!member) return;
    const { data: adminSettings } = await supabase.from('admin_settings').select('whatsapp_template_te').single();
    let template = adminSettings?.whatsapp_template_te || "Namaste {member_name}, please pay your due amount of ₹{total_due}.";
    
    template = template
      .replace('{member_name}', member.name)
      .replace('{total_due}', totalPending.toString());

    window.open(`https://wa.me/${member.phone}?text=${encodeURIComponent(template)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-milk text-plum">
        <Loader2 className="w-8 h-8 animate-spin text-plum" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-milk text-plum">
        <h3 className="text-lg font-bold text-plum mb-2">Member Not Found</h3>
        <button onClick={() => navigate('/members')} className="text-plum font-bold hover:underline mt-4 cursor-pointer">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 bg-milk text-plum font-body-md">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-plum/20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/members')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-milk border border-plum/20 text-plum hover:bg-plum hover:text-milk transition-all duration-200 hover:scale-105 active:scale-95 shadow-plum-sm cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-plum tracking-tight">{member.name}</h2>
            <div className="flex items-center gap-2 text-xs text-plum/60 mt-1 font-bold select-none">
              <span className="font-mono">{member.phone}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5 opacity-60" />
                {member.chit_groups?.name}
              </span>
            </div>
          </div>
        </div>
        
        {/* CTAs with hover inversion */}
        <div className="flex items-center gap-2.5 w-full md:w-auto font-bold text-xs">
          {totalPending > 0 && (
            <button 
              onClick={handleWhatsAppReminder}
              className="btn-milk px-4 py-2.5 flex items-center justify-center gap-2 flex-1 md:flex-none"
            >
              <Send className="w-3.5 h-3.5" />
              WhatsApp Reminder
            </button>
          )}
          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="btn-plum px-4 py-2.5 flex-1 md:flex-none"
          >
            Record Payment
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total Paid Card */}
        <div className="card-milk p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <Coins className="w-20 h-20 text-plum" />
          </div>
          <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1.5 font-geist">Contribution Ledger</p>
          <h3 className="text-2xl font-black text-plum font-mono tracking-tight">{formatCurrency(totalPaid)}</h3>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-plum/60 font-bold">
            <FileCheck className="w-3.5 h-3.5 text-plum" />
            <span>Successful Payments Verified</span>
          </div>
        </div>
        
        {/* Outstanding Dues Card */}
        <div className="card-milk p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <AlertCircle className="w-20 h-20 text-plum" />
          </div>
          <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1.5 font-geist">Outstanding Balance</p>
          <h3 className="text-2xl font-black text-plum font-mono tracking-tight">
            {formatCurrency(totalPending)}
          </h3>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{totalPending > 0 ? "Requires collection check" : "Installments fully paid"}</span>
          </div>
        </div>

      </section>

      {/* Payment Ledger section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-plum">Ledger History</h3>
        
        <div className="card-milk overflow-hidden hover:-translate-y-0.5">
          <div className="px-6 py-4 bg-plum text-milk border-b border-plum/20">
            <h4 className="text-sm font-bold">All Registered Transactions</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-plum text-milk border-b border-plum/20">
                <tr>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Date Recorded</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Receipt Number</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Payment Mode</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-right">Amount Paid</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs font-medium text-plum/50 bg-milk">
                      No payment records found for this member.
                    </td>
                  </tr>
                ) : (
                  payments.map(payment => {
                    const isVoided = !!payment.voided_at;
                    return (
                      <tr 
                        key={payment.id} 
                        className={`hover:bg-plum hover:text-milk transition-all duration-200 ease-in-out cursor-pointer group active:bg-plum/95 ${
                          isVoided ? 'bg-plum/5 opacity-70' : ''
                        }`}
                      >
                        {/* Date */}
                        <td className="px-6 py-4 text-xs font-bold font-mono">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        {/* Receipt */}
                        <td className="px-6 py-4 font-mono font-bold text-xs">
                          <span className={isVoided ? 'line-through text-plum/40 group-hover:text-milk/50' : 'text-plum group-hover:text-milk'}>
                            {payment.receipt_number}
                          </span>
                          {isVoided && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-plum text-milk border border-milk/10 text-[8px] font-bold uppercase tracking-wide group-hover:bg-milk group-hover:text-plum transition-colors duration-200">
                              VOIDED
                            </span>
                          )}
                        </td>
                        {/* Mode */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 bg-plum/5 border border-plum/10 text-plum text-[9px] font-bold rounded-lg uppercase group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 transition-colors duration-200">
                            {payment.payment_mode.replace('_', ' ')}
                          </span>
                        </td>
                        {/* Amount */}
                        <td className="px-6 py-4 font-mono font-black text-sm text-right">
                          {formatCurrency(payment.amount)}
                        </td>
                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                generateReceiptPDF(payment);
                              }}
                              className="p-2 border border-plum text-plum bg-milk hover:bg-plum hover:text-milk rounded-lg transition-all duration-200 shadow-plum-sm hover:scale-105 active:scale-90 group-hover:bg-milk group-hover:text-plum cursor-pointer"
                              title="Download Receipt PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {!isVoided ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPaymentForVoid(payment);
                                }}
                                className="p-2 border border-plum text-plum bg-milk hover:bg-plum hover:text-milk rounded-lg transition-all duration-200 shadow-plum-sm hover:scale-105 active:scale-90 group-hover:bg-milk group-hover:text-plum cursor-pointer"
                                title="Void Transaction"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="p-2 opacity-30 text-plum group-hover:text-milk/50" title={`Voided Reason: ${payment.void_reason}`}>
                                <Ban className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RecordPaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedMemberId={member.id}
        preselectedGroupId={member.group_id}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          loadMemberData();
        }}
      />

      {selectedPaymentForVoid && (
        <VoidPaymentModal 
          isOpen={!!selectedPaymentForVoid}
          onClose={() => setSelectedPaymentForVoid(null)}
          paymentId={selectedPaymentForVoid.id}
          receiptNumber={selectedPaymentForVoid.receipt_number}
          onSuccess={() => {
            setSelectedPaymentForVoid(null);
            loadMemberData();
          }}
        />
      )}
    </div>
  );
}
