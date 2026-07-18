import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/formatCurrency";
import { 
  Loader2, 
  ArrowLeft, 
  Settings2, 
  Landmark, 
  Coins, 
  AlertTriangle, 
  X
} from "lucide-react";
import { RecordReleaseModal } from "@/components/shared/RecordReleaseModal";

export function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ledger' | 'members'>('ledger');
  
  // Stats
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  
  // Data lists
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  // Edit Group state fields
  const [editName, setEditName] = useState("");
  const [editGracePeriod, setEditGracePeriod] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Close Group state fields
  const [confirmCloseName, setConfirmCloseName] = useState("");
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGroupData() {
      if (!id) return;
      setLoading(true);

      // Fetch group details
      const { data: groupData } = await supabase
        .from('chit_groups')
        .select('*')
        .eq('id', id)
        .single();
      
      if (groupData) {
        setGroup(groupData);
        setEditName(groupData.name);
        setEditGracePeriod(groupData.grace_period_days);
      }

      if (groupData) {
        // Fetch Payments for this group
        const { data: paymentsData } = await supabase
          .from('active_payments_view')
          .select(`
            *,
            members ( name )
          `)
          .eq('group_id', id)
          .order('paid_at', { ascending: false });

        if (paymentsData) {
          const mapped = paymentsData.map((p: any) => ({
            ...p,
            member_name: p.members?.name || "Unknown",
            payment_date: p.paid_at,
            amount: p.total_paid
          }));
          setPayments(mapped);
          
          const collected = mapped.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
          setTotalCollected(collected);
        } else {
          setPayments([]);
          setTotalCollected(0);
        }

        // Fetch Members for this group
        const { data: membersData } = await supabase
          .from('members')
          .select('*')
          .eq('group_id', id)
          .order('name');
          
        setMembers(membersData || []);

        // Fetch Pending for this group
        const { data: pendingData } = await supabase
          .from('pending_installments_view')
          .select('*')
          .eq('group_id', id);

        const pending = pendingData?.reduce((sum, p) => sum + (p.total_due || 0), 0) || 0;
        setTotalPending(pending);
      }

      setLoading(false);
    }
    
    loadGroupData();
  }, [id]);

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !group) return;
    setUpdating(true);
    setEditError(null);

    const { error } = await supabase
      .from("chit_groups")
      .update({
        name: editName,
        grace_period_days: Number(editGracePeriod)
      })
      .eq("id", id);

    if (error) {
      setEditError(error.message || "Failed to update group.");
      setUpdating(false);
    } else {
      setGroup({ ...group, name: editName, grace_period_days: Number(editGracePeriod) });
      setUpdating(false);
      setIsEditModalOpen(false);
    }
  };

  const handleCloseGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !group) return;
    if (confirmCloseName !== group.name) {
      setCloseError("Typed name does not match group name.");
      return;
    }

    setClosing(true);
    setCloseError(null);

    const { error } = await supabase
      .from("chit_groups")
      .update({
        status: "archived"
      })
      .eq("id", id);

    if (error) {
      setCloseError(error.message || "Failed to archive group.");
      setClosing(false);
    } else {
      setGroup({ ...group, status: "archived" });
      setClosing(false);
      setIsCloseModalOpen(false);
    }
  };

  async function reloadGroupData() {
    if (!id) return;
    const { data: groupData } = await supabase
      .from('chit_groups')
      .select('*')
      .eq('id', id)
      .single();
    
    if (groupData) {
      setGroup(groupData);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-milk text-plum">
        <Loader2 className="w-8 h-8 animate-spin text-plum" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-milk text-plum">
        <h3 className="text-lg font-bold text-plum mb-2">Group Not Found</h3>
        <button onClick={() => navigate('/groups')} className="text-plum font-bold hover:underline mt-4 cursor-pointer">Go Back</button>
      </div>
    );
  }

  const targetAmount = group.chit_amount * group.duration_months;
  const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((totalCollected / targetAmount) * 100)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 bg-milk text-plum">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-plum/20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/groups')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-milk border border-plum/20 text-plum hover:bg-plum hover:text-milk transition-all duration-200 hover:scale-105 active:scale-95 shadow-plum-sm cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-extrabold text-plum tracking-tight">{group.name}</h2>
              {group.status === 'archived' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-milk text-plum border border-plum/25 uppercase tracking-wide select-none">
                  Closed/Archived
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-plum text-milk border border-milk/10 uppercase tracking-wide select-none">
                  Active Pool
                </span>
              )}
            </div>
            <p className="text-xs text-plum/60 font-mono mt-0.5 font-bold">ID: {group.id}</p>
          </div>
        </div>
        
        {/* Top bar CTAs with Hover Inversion */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {group.status === 'active' ? (
            <>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="btn-milk px-4 py-2.5 flex-1 md:flex-none"
              >
                Edit Parameters
              </button>
              <button 
                onClick={() => setIsReleaseModalOpen(true)}
                className="btn-plum px-4 py-2.5 flex-1 md:flex-none"
              >
                Record Release
              </button>
              <button 
                onClick={() => setIsCloseModalOpen(true)}
                className="btn-milk px-4 py-2.5 flex-1 md:flex-none"
              >
                Close & Archive
              </button>
            </>
          ) : (
            <span className="text-xs font-bold text-plum/50 uppercase bg-plum/5 border border-plum/10 px-4 py-2 rounded-lg select-none">
              Closed Scheme Archive Ledger
            </span>
          )}
        </div>
      </div>

      {/* Chit Information Summary Block */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Chit Scheme Value */}
        <div className="card-milk p-6 flex items-center justify-between cursor-pointer active:scale-[0.99]" onClick={() => setActiveTab('ledger')}>
          <div>
            <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1.5 font-geist">Chit Scheme Value</p>
            <h3 className="text-2xl font-black text-plum font-mono tracking-tight">{formatCurrency(group.chit_amount)}</h3>
          </div>
          <div className="w-9 h-9 rounded-lg bg-plum flex items-center justify-center text-milk shadow-plum-sm">
            <Landmark className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Installments Rate */}
        <div className="card-milk p-6 flex items-center justify-between cursor-pointer active:scale-[0.99]" onClick={() => setActiveTab('ledger')}>
          <div>
            <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1.5 font-geist">Installment Rate</p>
            <h3 className="text-2xl font-black text-plum font-mono tracking-tight">
              {formatCurrency(group.installment_amount)} <span className="text-xs font-semibold text-plum/60 font-outfit uppercase">/ Mo</span>
            </h3>
          </div>
          <div className="w-9 h-9 rounded-lg bg-plum flex items-center justify-center text-milk shadow-plum-sm">
            <Coins className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Group Period */}
        <div className="card-milk p-6 flex items-center justify-between cursor-pointer active:scale-[0.99]" onClick={() => setIsEditModalOpen(true)}>
          <div>
            <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1.5 font-geist">Grace Period Details</p>
            <h3 className="text-2xl font-black text-plum tracking-tight">{group.grace_period_days} Days</h3>
          </div>
          <div className="w-9 h-9 rounded-lg bg-plum flex items-center justify-center text-milk shadow-plum-sm">
            <Settings2 className="w-4.5 h-4.5" />
          </div>
        </div>

      </section>

      {/* Target Progress Bar with card elevation hover */}
      <section className="card-milk p-6 space-y-4 hover:-translate-y-0.5">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
          <div>
            <p className="text-xs font-bold text-plum/60 uppercase tracking-wider">Pool Target Collections Progress</p>
            <h4 className="text-lg font-black font-mono mt-0.5 text-plum">
              {formatCurrency(totalCollected)} <span className="text-xs font-semibold text-plum/60 font-outfit">collected of {formatCurrency(targetAmount)} target</span>
            </h4>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-plum font-mono">{progressPercent}%</span>
          </div>
        </div>
        
        {/* Track Bar */}
        <div className="w-full h-3.5 bg-milk border border-plum/20 rounded-lg overflow-hidden p-0.5">
          <div 
            className="h-full bg-plum rounded-lg transition-all duration-500 shadow-plum-sm" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* Segmented Detail Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-plum/20 pb-4">
        <div className="flex p-1 bg-plum/5 rounded-lg border border-plum/10">
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ease-in-out active:scale-95 cursor-pointer ${
              activeTab === 'ledger' 
                ? 'bg-plum text-milk shadow-plum-sm' 
                : 'text-plum/60 hover:text-plum hover:bg-plum/5'
            }`}
          >
            Payments Ledger ({payments.length})
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ease-in-out active:scale-95 cursor-pointer ${
              activeTab === 'members' 
                ? 'bg-plum text-milk shadow-plum-sm' 
                : 'text-plum/60 hover:text-plum hover:bg-plum/5'
            }`}
          >
            Scheme Enrolled Members ({members.length})
          </button>
        </div>

        <span className="text-xs font-bold text-plum bg-milk border border-plum/25 px-3 py-1 rounded-lg uppercase tracking-wider select-none">
          {activeTab === 'ledger' 
            ? `Pending Group Balance: ${formatCurrency(totalPending)}` 
            : `Group Size Limit: ${group.duration_months} Max`}
        </span>
      </div>

      {/* Dynamic Tab Body Table with card elevation wrapper */}
      <div className="card-milk min-h-[300px] overflow-hidden">
        {activeTab === 'ledger' ? (
          /* Tab 1: Ledger payments */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-plum text-milk border-b border-plum/20">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Date Recorded</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Receipt No</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Member Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Payment Mode</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Total Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs font-medium text-plum/50 bg-milk">
                      No payments have been recorded for this group yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const isVoided = !!p.voided_at;
                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-plum hover:text-milk transition-all duration-200 ease-in-out cursor-pointer group active:bg-plum/95 ${
                          isVoided ? 'bg-plum/5 opacity-70' : ''
                        }`}
                        onClick={() => navigate(`/members/${p.member_id}`)}
                      >
                        <td className="px-6 py-4 font-mono text-xs font-bold">{new Date(p.payment_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-mono font-bold text-xs">
                          <span className={isVoided ? 'line-through text-plum/40 group-hover:text-milk/50' : 'text-plum group-hover:text-milk'}>
                            {p.receipt_number}
                          </span>
                          {isVoided && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-plum text-milk border border-milk/10 text-[8px] font-bold uppercase tracking-wide group-hover:bg-milk group-hover:text-plum transition-colors duration-200">
                              Voided
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold">{p.member_name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 bg-plum/5 border border-plum/10 text-plum text-[9px] font-bold rounded-lg uppercase group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 transition-all duration-200">
                            {p.payment_mode.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-sm text-right">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tab 2: Members list */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-plum text-milk border-b border-plum/20">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Member Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Phone number</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Registry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-xs font-medium text-plum/50 bg-milk">
                      No members are currently enrolled in this group.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr 
                      key={m.id} 
                      className="hover:bg-plum hover:text-milk transition-all duration-200 ease-in-out cursor-pointer group active:bg-plum/95"
                      onClick={() => navigate(`/members/${m.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-plum text-milk flex items-center justify-center font-bold text-xs uppercase shadow-plum-sm group-hover:bg-milk group-hover:text-plum transition-colors duration-200">
                            {m.name.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{m.name}</div>
                            <div className="text-[10px] text-plum/60 group-hover:text-milk/60 mt-0.5 font-bold">Enrolled: {new Date(m.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold">{m.phone}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[9px] font-bold bg-plum text-milk border border-milk/10 group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 uppercase tracking-wide transition-colors duration-200">
                          Active Enrollee
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Parameters Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-plum/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="bg-milk w-full max-w-[440px] rounded-lg shadow-plum-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-250 relative z-10 overflow-hidden border border-plum/20">
            <div className="px-6 py-5 bg-plum text-milk border-b border-milk/10 flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-milk">Edit Group Parameters</h3>
                <p className="text-[10px] text-milk/60 mt-0.5 font-bold">Update active system configurations.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-milk/10 text-milk/80 hover:text-milk rounded-lg transition-colors duration-200 active:scale-90 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditGroup} className="p-6 space-y-4">
              {editError && (
                <div className="bg-milk border border-plum p-3 text-xs font-bold rounded-lg">{editError}</div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block">Group name</label>
                <input 
                  type="text" 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm input-milk"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block">Grace Period (Days)</label>
                <input 
                  type="number" 
                  required
                  min={0}
                  value={editGracePeriod}
                  onChange={(e) => setEditGracePeriod(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm input-milk font-mono"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-plum/10">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-plum rounded-lg text-xs font-bold transition-all hover:bg-plum hover:text-milk hover:border-transparent active:scale-95 duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 btn-plum shadow-plum-sm flex items-center gap-1.5"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close/Archive Scheme Modal */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-plum/40 backdrop-blur-sm" onClick={() => setIsCloseModalOpen(false)} />
          <div className="bg-milk w-full max-w-[440px] rounded-lg shadow-plum-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-250 relative z-10 overflow-hidden border border-plum/20">
            <div className="px-6 py-5 bg-plum text-milk border-b border-milk/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-milk animate-bounce" />
                <div>
                  <h3 className="text-base font-extrabold text-milk">Archive Chit Scheme</h3>
                  <p className="text-[10px] text-milk/60 mt-0.5 font-bold">Auditing permanent transition</p>
                </div>
              </div>
              <button onClick={() => setIsCloseModalOpen(false)} className="p-1.5 hover:bg-milk/10 text-milk/80 hover:text-milk rounded-lg transition-colors duration-200 active:scale-90 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCloseGroup} className="p-6 space-y-4">
              {closeError && (
                <div className="bg-milk border border-plum p-3 text-xs font-bold rounded-lg">{closeError}</div>
              )}
              
              <div className="space-y-2">
                <p className="text-xs leading-normal">
                  Are you absolutely sure you want to archive <strong>{group.name}</strong>?
                </p>
                <div className="p-3 bg-plum text-milk rounded-lg text-[10px] leading-normal font-bold">
                  Warning: Archiving disables new payment recordings, member additions, and auction prize release events. History is kept as read-only.
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider block">
                  Type <span className="font-mono text-plum/70 bg-plum/5 border border-plum/20 px-1 rounded">{group.name}</span> to confirm
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Type exact group name..."
                  value={confirmCloseName}
                  onChange={(e) => setConfirmCloseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm input-milk placeholder:text-plum/40"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-plum/10">
                <button 
                  type="button" 
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2 border border-plum rounded-lg text-xs font-bold transition-all hover:bg-plum hover:text-milk hover:border-transparent active:scale-95 duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={closing || confirmCloseName !== group.name}
                  className="px-4 py-2 btn-plum shadow-plum-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {closing ? "Archiving..." : "Confirm Close"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Release Payout Modal */}
      {isReleaseModalOpen && (
        <RecordReleaseModal 
          isOpen={isReleaseModalOpen}
          open={isReleaseModalOpen}
          onClose={() => setIsReleaseModalOpen(false)}
          onOpenChange={(v) => setIsReleaseModalOpen(v)}
          preselectedGroupId={group.id}
          onSuccess={async () => {
            setIsReleaseModalOpen(false);
            await reloadGroupData();
          }}
        />
      )}
    </div>
  );
}
