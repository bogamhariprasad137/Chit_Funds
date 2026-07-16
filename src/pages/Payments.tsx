import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { MoreHorizontal, Download, Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";

type PaymentRow = {
  id: string;
  receipt_number: string;
  paid_at: string;
  member_id: string;
  group_id: string;
  payment_mode: string;
  total_paid: number;
  voided_at: string | null;
  members?: { name: string };
  chit_groups?: { name: string };
};

export function Payments() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    // Use active_payments_view to exclude voided by default (as per DB design),
    // but the UI design has a "Voided" status. If the view excludes them, we can't show them.
    // The TRD says "The frontend will query this view for ledgers to guarantee voided payments never accidentally leak into calculations."
    // For a comprehensive ledger, maybe we query `payments`? Or just `active_payments_view`?
    // We'll query `payments` here because the ledger explicitly shows Voided payments in the design.
    // Wait, let's use `payments` and just render the voided status correctly. Calculations will use the view.
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        members(name),
        chit_groups(name)
      `)
      .order("paid_at", { ascending: false });

    if (data) {
      setPayments(data as any);
    } else if (error) {
      console.error(error);
    }
    setLoading(false);
  }

  const handleVoidPayment = async (id: string) => {
    const reason = prompt("Enter reason for voiding this payment:");
    if (!reason) return;
    
    try {
      const { error } = await supabase.rpc("void_payment", {
        p_payment_id: id,
        p_void_reason: reason
      });
      if (error) throw error;
      fetchPayments();
    } catch (err: any) {
      alert("Failed to void: " + err.message);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 display-font tracking-tight">
            Payment Ledger
          </h1>
          <p className="text-slate-500 font-medium mt-1">Immutable audit log of all cash flows.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[200px]">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-900">Receipt #</TableHead>
                <TableHead className="font-semibold text-slate-900">Date</TableHead>
                <TableHead className="font-semibold text-slate-900">Member</TableHead>
                <TableHead className="font-semibold text-slate-900">Group</TableHead>
                <TableHead className="font-semibold text-slate-900">Mode</TableHead>
                <TableHead className="font-semibold text-slate-900 text-right">Amount</TableHead>
                <TableHead className="font-semibold text-slate-900 text-center">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                    No payments found.
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
                      <TableCell className={`font-semibold ${isVoided ? 'text-slate-400' : 'text-slate-900'}`}>
                        {payment.members?.name || "Unknown"}
                      </TableCell>
                      <TableCell className={isVoided ? 'text-slate-400' : 'text-slate-600'}>
                        {payment.chit_groups?.name || "Unknown"}
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                              <Download className="mr-2 h-4 w-4" />
                              <span>Download Receipt</span>
                            </DropdownMenuItem>
                            {!isVoided && (
                              <DropdownMenuItem 
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => handleVoidPayment(payment.id)}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                <span>Void Payment</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
  );
}
