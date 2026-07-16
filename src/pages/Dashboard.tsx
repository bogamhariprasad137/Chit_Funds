import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { Users, UserSquare2, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calculatePendingPayments } from "@/lib/pendingCalculations";
import type { PendingPayment } from "@/lib/pendingCalculations";
import { Badge } from "@/components/ui/badge";

type RecentActivity = {
  id: string;
  name: string;
  date: string;
  amount: number;
};

export function Dashboard() {
  const { t } = useTranslation();
  const [activeGroupsCount, setActiveGroupsCount] = useState<number>(0);
  const [activeMembersCount, setActiveMembersCount] = useState<number>(0);
  const [collectionsTotal, setCollectionsTotal] = useState<number>(0);
  const [pendingTotal, setPendingTotal] = useState<number>(0);
  const [pendingAlerts, setPendingAlerts] = useState<PendingPayment[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    async function fetchKPIs() {
      // 1. Active Groups
      const { count: groupCount } = await supabase
        .from("chit_groups")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (groupCount !== null) {
        setActiveGroupsCount(groupCount);
      }

      // 2. Active Members
      const { count: memberCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });

      if (memberCount !== null) {
        setActiveMembersCount(memberCount);
      }

      // 3. Collections (from dashboard_metrics_view if it exists, otherwise fallback to sum)
      const { data: metrics } = await supabase.from("dashboard_metrics_view").select("*").single();
      if (metrics && metrics.month_collections !== undefined) {
        setCollectionsTotal(metrics.month_collections || 0);
      } else {
        // Fallback sum from payments
        const { data: payments } = await supabase.from("payments").select("total_paid").is("voided_at", null);
        if (payments) {
          const sum = payments.reduce((acc, p) => acc + p.total_paid, 0);
          setCollectionsTotal(sum);
        }
      }

      // 4. Recent Activity (latest 5 payments)
      const { data: recent } = await supabase
        .from("payments")
        .select("id, total_paid, paid_at, members(name)")
        .is("voided_at", null)
        .order("paid_at", { ascending: false })
        .limit(5);

      if (recent) {
        setRecentActivities(recent.map(r => ({
          id: r.id,
          name: (r.members as any)?.name || "Unknown",
          date: format(new Date(r.paid_at), "dd MMM yyyy"),
          amount: r.total_paid
        })));
      }

      // 5. Pending Payments calculation
      try {
        const pending = await calculatePendingPayments();
        const totalPending = pending.reduce((acc, p) => acc + p.total, 0);
        setPendingTotal(totalPending);
        setPendingAlerts(pending.slice(0, 3)); // Show top 3
      } catch (err) {
        console.error("Error calculating pending payments", err);
      }
    }
    fetchKPIs();
  }, []);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 display-font tracking-tight">
          {t('dashboard.title', 'Namaste, Admin')}
        </h1>
        <p className="text-slate-500 font-medium">{t('dashboard.description', 'Your chit funds are performing well today.')}</p>
      </div>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="w-5 h-5 text-slate-900" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Active Groups</p>
            <p className="text-2xl font-bold text-slate-900">{activeGroupsCount}</p>
          </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <UserSquare2 className="w-5 h-5 text-slate-900" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Active Members</p>
            <p className="text-2xl font-bold text-slate-900">{activeMembersCount}</p>
          </div>
        </div>
        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Wallet className="w-5 h-5 text-slate-900" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Collections</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(collectionsTotal)}</p>
          </div>
        </div>
        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 rounded-lg">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(pendingTotal)}</p>
          </div>
        </div>
      </div>
      
      {/* Pending Payments Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-slate-900">Pending Payments Alerts</h2>
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {pendingAlerts.length} ALERTS
          </span>
        </div>
        
        <div className="space-y-3">
          {pendingAlerts.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500">
              No pending payments found!
            </div>
          ) : (
            pendingAlerts.map((member) => (
              <div key={member.id} className={`bg-white border-l-4 ${member.status === 'Overdue' ? 'border-red-400' : 'border-amber-400'} p-4 rounded-r-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase">
                    {member.member.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{member.member} <span className="text-xs text-slate-500 ml-1 font-normal">({member.group})</span></p>
                    <p className="text-sm text-slate-500 tabular-nums font-medium">Due: {formatCurrency(member.total)} <Badge variant="outline" className={`ml-2 text-[10px] ${member.status === 'Overdue' ? 'text-red-600 border-red-200' : 'text-amber-600 border-amber-200'}`}>{member.status}</Badge></p>
                  </div>
                </div>
                <Button size="sm" className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold w-full sm:w-auto min-h-[44px]">
                  Send Reminder
                </Button>
              </div>
            ))
          )}
        </div>
      </section>
      
      {/* Recent Activity Feed */}
      <section className="space-y-4">
        <h2 className="text-lg md:text-xl font-bold text-slate-900">Recent Activity</h2>
        
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden shadow-sm">
          {recentActivities.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No recent payments.
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-90" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{activity.name}</p>
                    <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{activity.date}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end justify-center">
                  <p className="font-bold text-slate-900 tabular-nums">{formatCurrency(activity.amount)}</p>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Success
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
