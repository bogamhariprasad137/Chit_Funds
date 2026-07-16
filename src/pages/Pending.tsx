import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Search, Filter, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WhatsAppReminderModal } from "@/components/shared/WhatsAppReminderModal";
import { calculatePendingPayments } from "@/lib/pendingCalculations";
import type { PendingPayment } from "@/lib/pendingCalculations";

export function Pending() {
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [pendingList, setPendingList] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await calculatePendingPayments();
        setPendingList(data);
      } catch (err) {
        console.error("Failed to load pending payments", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSendReminder = (member: PendingPayment) => {
    setSelectedMember({
      name: member.member,
      groupName: member.group,
      installment: member.amount,
      penalty: member.penalty,
      total: member.total,
      phone: member.phone
    });
    setIsReminderOpen(true);
  };

  const filteredList = pendingList.filter(p => 
    p.member.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 display-font tracking-tight">
            Pending Payments
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage overdue installments and send reminders.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by member or group..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-500">Member</TableHead>
                <TableHead className="font-semibold text-slate-500">Group</TableHead>
                <TableHead className="font-semibold text-slate-500">Due Date</TableHead>
                <TableHead className="font-semibold text-slate-500">Status</TableHead>
                <TableHead className="font-semibold text-slate-500 text-right">Total Due</TableHead>
                <TableHead className="font-semibold text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    No pending payments found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item) => (
                  <TableRow key={item.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                    <TableCell className="font-semibold text-slate-900">
                      {item.member}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {item.group}
                    </TableCell>
                    <TableCell className="text-slate-600 tabular-nums">
                      {item.dueDate}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`
                          ${item.status === 'Overdue' ? 'bg-red-100 text-red-700 hover:bg-red-100/80' : ''}
                          ${item.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100/80' : ''}
                          border-transparent
                        `}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900 tabular-nums">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSendReminder(item)}
                        className="border-amber-400 text-amber-900 bg-amber-50 hover:bg-amber-100 border transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        Send Reminder
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedMember && (
        <WhatsAppReminderModal 
          open={isReminderOpen} 
          onOpenChange={setIsReminderOpen} 
          memberInfo={selectedMember}
        />
      )}
    </div>
  );
}
