import { format, startOfMonth, addMonths, differenceInCalendarMonths, differenceInMonths, addDays, isAfter } from "date-fns";
import { supabase } from "@/lib/supabase";

export type PendingPayment = {
  id: string; // synthetic ID: memberId_month
  member: string;
  member_id: string;
  phone: string;
  group: string;
  group_id: string;
  dueDate: string; // string representation
  status: "Overdue" | "Pending";
  amount: number;
  penalty: number;
  total: number;
};

export async function calculatePendingPayments(): Promise<PendingPayment[]> {
  // Fetch active groups
  const { data: groups } = await supabase.from("chit_groups").select("*").eq("status", "active");
  if (!groups) return [];

  // Fetch all members
  const { data: members } = await supabase.from("members").select("*");
  if (!members) return [];

  // Fetch active payments (voided_at IS NULL)
  const { data: payments } = await supabase.from("payments").select("*").is("voided_at", null);
  if (!payments) return [];

  const currentDate = new Date();
  const currentMonthStart = startOfMonth(currentDate);

  const calculatedPending: PendingPayment[] = [];

  for (const group of groups) {
    const groupMembers = members.filter(m => m.group_id === group.id);
    const groupStartDate = new Date(group.start_date);
    const startMonth = startOfMonth(groupStartDate);
    
    let monthsToCheck = differenceInCalendarMonths(currentMonthStart, startMonth) + 1;
    if (monthsToCheck > group.duration_months) {
      monthsToCheck = group.duration_months;
    }

    for (const member of groupMembers) {
      const memberPayments = payments.filter(p => p.member_id === member.id && p.group_id === group.id);

      for (let i = 0; i < monthsToCheck; i++) {
        const expectedMonth = addMonths(startMonth, i);
        const expectedMonthStr = format(expectedMonth, "yyyy-MM-dd");
        
        const hasPaid = memberPayments.some(p => p.installment_month === expectedMonthStr);
        if (!hasPaid) {
          const dueDate = expectedMonth;
          const graceCutoff = addDays(dueDate, group.grace_period_days);
          const isOverdue = isAfter(currentDate, graceCutoff);
          let penalty = 0;

          if (isOverdue) {
            let overdueMonths = differenceInMonths(currentDate, graceCutoff);
            if (overdueMonths < 1) overdueMonths = 1;
            penalty = overdueMonths * group.monthly_penalty_rate;
          }

          calculatedPending.push({
            id: `${member.id}_${expectedMonthStr}`,
            member: member.name,
            member_id: member.id,
            phone: member.phone,
            group: group.name,
            group_id: group.id,
            dueDate: format(dueDate, "dd MMM yyyy"),
            status: isOverdue ? "Overdue" : "Pending",
            amount: group.installment_amount,
            penalty,
            total: group.installment_amount + penalty
          });
        }
      }
    }
  }
  
  // Sort: Overdue first, then by date, then amount
  calculatedPending.sort((a, b) => {
    if (a.status === "Overdue" && b.status === "Pending") return -1;
    if (a.status === "Pending" && b.status === "Overdue") return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return calculatedPending;
}
