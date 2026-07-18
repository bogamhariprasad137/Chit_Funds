import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/formatCurrency";
import { 
  Users, 
  Layers, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight, 
  Plus, 
  FileText, 
  Loader2,
  Calendar,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState({
    activeGroups: 0,
    activeMembers: 0,
    totalCollections: 0,
    totalPending: 0
  });
  const [loading, setLoading] = useState(true);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch Active Groups Count
        const { count: groupsCount } = await supabase
          .from('chit_groups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch Members Count
        const { count: membersCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true });

        // Fetch Total Collections (Current Month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: payments } = await supabase
          .from('active_payments_view')
          .select('total_paid')
          .gte('paid_at', startOfMonth.toISOString());

        const totalCollections = payments?.reduce((sum, p) => sum + (Number(p.total_paid) || 0), 0) || 0;

        // Fetch Pending Payments
        const { data: pendingData } = await supabase
          .from('pending_installments_view')
          .select('*');

        const totalPending = pendingData?.reduce((sum, p) => sum + (Number(p.total_due) || 0), 0) || 0;

        setMetrics({
          activeGroups: groupsCount || 0,
          activeMembers: membersCount || 0,
          totalCollections,
          totalPending
        });

        // Show top 4 pending members
        if (pendingData) {
          setPendingMembers(pendingData.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-milk text-plum">
        <Loader2 className="w-8 h-8 animate-spin text-plum" />
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 bg-milk text-plum">
      {/* Dynamic Translated Page Heading */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-sm font-medium text-plum/60 mt-1 font-outfit">{t("dashboard.description")}</p>
        </div>
      </div>

      {/* Welcome Banner (PLUM Background -> MILK Text) */}
      <section className="relative overflow-hidden rounded-lg bg-plum p-8 text-milk shadow-milk-lg border border-milk/10 hover:shadow-milk-xl transition-all duration-300 ease-in-out">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-milk/10 text-milk rounded-lg text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-milk rounded-full animate-pulse"></span>
              Live Operations
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-milk">Namaste, Administrator</h2>
            <p className="text-milk/75 text-sm font-medium font-outfit">ChitLedger Financial Suite is performing optimally.</p>
          </div>
          <div className="flex items-center gap-2 bg-milk/10 border border-milk/15 px-4 py-2 rounded-lg text-xs font-bold text-milk backdrop-blur-sm self-start sm:self-auto hover:bg-milk/20 transition-all duration-200 select-none">
            <Calendar className="w-3.5 h-3.5 text-milk" />
            {currentDate}
          </div>
        </div>
      </section>

      {/* KPI Cards Grid (MILK Background -> PLUM Text) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Groups Card */}
        <div className="card-milk p-6 flex flex-col justify-between cursor-pointer active:scale-[0.99]" onClick={() => navigate('/groups')}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-9 h-9 rounded-lg bg-plum flex items-center justify-center text-milk transition-transform duration-300 group-hover:rotate-3 shadow-plum-sm">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-plum uppercase tracking-widest bg-plum/5 px-2.5 py-1 rounded-lg border border-plum/10">Groups</span>
          </div>
          <div>
            <p className="text-xs font-bold text-plum/60 uppercase tracking-wider mb-1">Active Schemes</p>
            <p className="text-3xl font-extrabold text-plum tracking-tight">{metrics.activeGroups}</p>
          </div>
        </div>

        {/* Active Members Card */}
        <div className="card-milk p-6 flex flex-col justify-between cursor-pointer active:scale-[0.99]" onClick={() => navigate('/members')}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-9 h-9 rounded-lg bg-plum flex items-center justify-center text-milk transition-transform duration-300 group-hover:rotate-3 shadow-plum-sm">
              <Users className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-plum uppercase tracking-widest bg-plum/5 px-2.5 py-1 rounded-lg border border-plum/10">Members</span>
          </div>
          <div>
            <p className="text-xs font-bold text-plum/60 uppercase tracking-wider mb-1">Total Enrolled</p>
            <p className="text-3xl font-extrabold text-plum tracking-tight">{metrics.activeMembers}</p>
          </div>
        </div>

        {/* Current Collections Card */}
        <div className="card-milk p-6 flex flex-col justify-between cursor-pointer active:scale-[0.99]" onClick={() => navigate('/payments')}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-9 h-9 rounded-lg bg-plum flex items-center justify-center text-milk transition-transform duration-300 group-hover:rotate-3 shadow-plum-sm">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-plum uppercase tracking-widest bg-plum/5 px-2.5 py-1 rounded-lg border border-plum/10">Collections</span>
          </div>
          <div>
            <p className="text-xs font-bold text-plum/60 uppercase tracking-wider mb-1">This Month</p>
            <p className="text-3xl font-black text-plum font-mono tracking-tight">{formatCurrency(metrics.totalCollections)}</p>
          </div>
        </div>

        {/* Pending Collections Card */}
        <div className="card-milk p-6 flex flex-col justify-between cursor-pointer active:scale-[0.99]" onClick={() => navigate('/pending')}>
          <div className="flex justify-between items-start mb-6">
            <div className="w-9 h-9 rounded-lg bg-plum flex items-center justify-center text-milk transition-transform duration-300 group-hover:rotate-3 shadow-plum-sm">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-bold text-plum uppercase tracking-widest bg-plum/5 px-2.5 py-1 rounded-lg border border-plum/10">Dues</span>
          </div>
          <div>
            <p className="text-xs font-bold text-plum/60 uppercase tracking-wider mb-1">Outstanding Dues</p>
            <p className="text-3xl font-black text-plum font-mono tracking-tight">
              {formatCurrency(metrics.totalPending)}
            </p>
          </div>
        </div>

      </section>

      {/* Main layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Urgent Pending Payments Card */}
        <section className="lg:col-span-8 card-milk p-6 space-y-5 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-plum">Urgent Pending Payments</h3>
              <p className="text-xs text-plum/60 mt-0.5">Top members overdue on active installments.</p>
            </div>
            {pendingMembers.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-plum text-milk rounded-lg text-[10px] font-bold uppercase tracking-wider select-none">
                {pendingMembers.length} Active Dues
              </span>
            )}
          </div>
          
          <div className="divide-y divide-plum/10">
            {pendingMembers.length === 0 ? (
              <div className="py-12 text-center text-plum/50 space-y-2 bg-milk rounded-lg border border-dashed border-plum/15">
                <ShieldCheck className="w-10 h-10 text-plum mx-auto" />
                <p className="text-sm font-bold text-plum">All Collections Reconciled</p>
                <p className="text-xs text-plum/60">There are no outstanding member dues in active groups.</p>
              </div>
            ) : (
              pendingMembers.map((member, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 hover:bg-plum/5 px-2 rounded-lg transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-plum flex items-center justify-center font-bold text-milk text-xs uppercase shadow-milk-sm">
                      {member.member_name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-plum">{member.member_name}</p>
                      <p className="text-[10px] font-bold text-plum/60 uppercase tracking-wider">{member.group_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-plum/60 uppercase tracking-wider">Amount Due</p>
                      <p className="text-sm font-black text-plum font-mono">{formatCurrency(member.total_due)}</p>
                    </div>
                    <button 
                      onClick={() => navigate('/pending')}
                      className="inline-flex items-center justify-center p-2 hover:bg-plum text-plum hover:text-milk rounded-lg transition-all duration-200 border border-plum/25 active:scale-95 hover:scale-105 shadow-plum-sm cursor-pointer"
                      title="Navigate to Reminders"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {pendingMembers.length > 0 && (
            <button 
              onClick={() => navigate('/pending')}
              className="w-full btn-plum py-2.5 flex items-center justify-center gap-1.5"
            >
              Reconcile Dues & Send Reminders
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </section>

        {/* Right Column: Workflows & Actions (PLUM Container -> MILK Elements) */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="bg-plum text-milk rounded-lg p-6 border border-milk/10 shadow-milk-lg space-y-5 hover:shadow-milk-xl transition-all duration-300 ease-in-out">
            <div>
              <h3 className="text-base font-bold text-milk">Operational Actions</h3>
              <p className="text-[11px] text-milk/60 mt-0.5 font-bold">Quick shortcuts for daily workflow operations.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-2.5">
              <button 
                onClick={() => navigate('/pending')}
                className="w-full bg-milk/10 hover:bg-milk text-milk hover:text-plum border border-milk/10 hover:border-transparent py-2.5 px-4 rounded-lg text-xs font-bold text-left flex items-center justify-between transition-all duration-200 ease-in-out hover:translate-x-1 active:scale-[0.98] group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-milk group-hover:bg-plum rounded-full"></span>
                  Record Member Payment
                </span>
                <Plus className="w-4 h-4 text-milk/60 group-hover:text-plum transition-colors" />
              </button>

              <button 
                onClick={() => navigate('/groups')}
                className="w-full bg-milk/10 hover:bg-milk text-milk hover:text-plum border border-milk/10 hover:border-transparent py-2.5 px-4 rounded-lg text-xs font-bold text-left flex items-center justify-between transition-all duration-200 ease-in-out hover:translate-x-1 active:scale-[0.98] group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-milk group-hover:bg-plum rounded-full"></span>
                  Create Chit Scheme Group
                </span>
                <Plus className="w-4 h-4 text-milk/60 group-hover:text-plum transition-colors" />
              </button>

              <button 
                onClick={() => navigate('/members')}
                className="w-full bg-milk/10 hover:bg-milk text-milk hover:text-plum border border-milk/10 hover:border-transparent py-2.5 px-4 rounded-lg text-xs font-bold text-left flex items-center justify-between transition-all duration-200 ease-in-out hover:translate-x-1 active:scale-[0.98] group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-milk group-hover:bg-plum rounded-full"></span>
                  Enroll New Member
                </span>
                <Plus className="w-4 h-4 text-milk/60 group-hover:text-plum transition-colors" />
              </button>

              <button 
                onClick={() => navigate('/reports')}
                className="w-full bg-milk/5 hover:bg-milk text-milk/80 hover:text-plum border border-milk/5 hover:border-transparent py-2.5 px-4 rounded-lg text-xs font-bold text-left flex items-center justify-between transition-all duration-200 ease-in-out hover:translate-x-1 active:scale-[0.98] group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-milk/50 group-hover:bg-plum rounded-full"></span>
                  Download Audit Reports
                </span>
                <FileText className="w-4 h-4 text-milk/50 group-hover:text-plum transition-colors" />
              </button>
            </div>
          </div>
          
        </section>
        
      </div>
    </div>
  );
}
