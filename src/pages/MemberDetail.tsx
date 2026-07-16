import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Wallet, Loader2 } from "lucide-react";
import { WhatsAppReminderModal } from "@/components/shared/WhatsAppReminderModal";
import { supabase } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type MemberWithGroup = {
  id: string;
  name: string;
  phone: string;
  group_id: string;
  chit_groups: { name: string; status: string; installment_amount: number } | null;
};

type PaymentRow = {
  id: string;
  receipt_number: string;
  paid_at: string;
  installment_month: string;
  payment_mode: string;
  total_paid: number;
  voided_at: string | null;
};

export function MemberDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [member, setMember] = useState<MemberWithGroup | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true);

  useEffect(() => {
    async function fetchMemberData() {
      if (!id) return;
      setIsLoading(true);
      
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select(`
          id,
          name,
          phone,
          group_id,
          chit_groups ( name, status, installment_amount )
        `)
        .eq("id", id)
        .single();

      if (memberError) {
        console.error("Error fetching member:", memberError);
      } else {
        // @ts-ignore
        setMember(memberData);
      }
      setIsLoading(false);
    }
    fetchMemberData();
  }, [id]);

  useEffect(() => {
    async function fetchPayments() {
      if (!id) return;
      setIsPaymentsLoading(true);
      
      const { data, error } = await supabase
        .from("payments")
        .select(`*`)
        .eq("member_id", id)
        .order("paid_at", { ascending: false });

      if (error) {
        console.error("Error fetching payments:", error);
      } else if (data) {
        setPayments(data as any);
      }
      
      setIsPaymentsLoading(false);
    }
    fetchPayments();
  }, [id]);

  if (isLoading) {
    return <div className="w-full text-center py-12 text-slate-500">Loading member details...</div>;
  }

  if (!member) {
    return <div className="w-full text-center py-12 text-slate-500">Member not found.</div>;
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="w-10 h-10 border-slate-200"
            onClick={() => navigate('/members')}
          >
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 display-font tracking-tight">
              {member.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`uppercase tracking-wider text-[10px] ${member.chit_groups?.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                {member.chit_groups?.status || 'Unknown'}
              </Badge>
              <span className="text-sm font-medium text-slate-500">
                {member.phone}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsReminderOpen(true)}
            className="border-amber-400 text-amber-950 font-semibold bg-amber-50 hover:bg-amber-100 hover:text-amber-950 border"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Send Reminder
          </Button>
        </div>
      </div>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Group Assignment</p>
          <p className="text-2xl font-bold text-slate-900">{member.chit_groups?.name || 'N/A'}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Monthly Installment</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(member.chit_groups?.installment_amount || 0)}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Payment Ledger</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[200px]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-900">Receipt #</TableHead>
                  <TableHead className="font-semibold text-slate-900">Date Paid</TableHead>
                  <TableHead className="font-semibold text-slate-900">Installment Month</TableHead>
                  <TableHead className="font-semibold text-slate-900">Mode</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPaymentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No payments found for this member.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => {
                    const isVoided = !!payment.voided_at;
                    return (
                      <TableRow 
                        key={payment.id} 
                        className={`hover:bg-slate-50 transition-colors ${isVoided ? 'bg-slate-50/50' : ''}`}
                      >
                        <TableCell className={`font-mono text-xs font-semibold ${isVoided ? 'text-slate-400' : 'text-slate-900'}`}>
                          {payment.receipt_number}
                        </TableCell>
                        <TableCell className={`text-sm tabular-nums ${isVoided ? 'text-slate-400' : 'text-slate-600'}`}>
                          {format(new Date(payment.paid_at), "dd MMM yyyy, HH:mm")}
                        </TableCell>
                        <TableCell className={`text-sm tabular-nums ${isVoided ? 'text-slate-400' : 'text-slate-600'}`}>
                          {format(new Date(payment.installment_month), "MMMM yyyy")}
                        </TableCell>
                        <TableCell className={`capitalize ${isVoided ? 'text-slate-400' : 'text-slate-600'}`}>
                          {payment.payment_mode.replace('_', ' ')}
                        </TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${
                          isVoided ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}>
                          {formatCurrency(payment.total_paid)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="secondary" 
                            className={`font-semibold uppercase tracking-wider text-[10px] ${
                              isVoided 
                                ? 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200' 
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                          >
                            {isVoided ? "Voided" : "Success"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <WhatsAppReminderModal 
        open={isReminderOpen} 
        onOpenChange={setIsReminderOpen} 
      />
    </div>
  );
}
