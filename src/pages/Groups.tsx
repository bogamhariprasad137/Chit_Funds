import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CreateGroupModal } from "@/components/shared/CreateGroupModal";
import { formatCurrency } from "@/lib/formatCurrency";
import { Loader2, Plus, ArrowRight, Landmark, Clock } from "lucide-react";
import { useNavigate } from "react-router";

type GroupStatus = 'active' | 'archived';

export function Groups() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<GroupStatus>('active');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchGroups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chit_groups')
      .select('*')
      .eq('status', activeTab)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGroups(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [activeTab]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 bg-milk text-plum">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum tracking-tight">Chit Groups</h1>
          <p className="text-sm font-medium text-plum/60 mt-1 font-outfit">Manage and audit active chit pool schemes.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-plum px-5 py-3 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {/* Segmented Control Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-plum/20 pb-4">
        <div className="flex p-1 bg-plum/5 rounded-lg border border-plum/10">
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ease-in-out active:scale-95 cursor-pointer ${
              activeTab === 'active' 
                ? 'bg-plum text-milk shadow-plum-sm' 
                : 'text-plum/60 hover:text-plum hover:bg-plum/5'
            }`}
          >
            Active Schemes
          </button>
          <button 
            onClick={() => setActiveTab('archived')}
            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ease-in-out active:scale-95 cursor-pointer ${
              activeTab === 'archived' 
                ? 'bg-plum text-milk shadow-plum-sm' 
                : 'text-plum/60 hover:text-plum hover:bg-plum/5'
            }`}
          >
            Archived Ledger
          </button>
        </div>
        
        {/* Count Badge indicator */}
        <span className="text-xs font-bold text-plum bg-milk border border-plum/25 px-3 py-1 rounded-lg uppercase tracking-wider select-none">
          {groups.length} Group{groups.length !== 1 ? 's' : ''} listed
        </span>
      </div>

      {/* Main Data Table Card wrapper with hover elevation */}
      <div className="card-milk min-h-[300px] overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-plum" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-14 h-14 bg-plum/5 border border-plum/15 rounded-lg flex items-center justify-center mb-4 shadow-plum-sm">
              <Landmark className="w-6 h-6 text-plum" />
            </div>
            <h3 className="text-base font-bold text-plum mb-1">No Groups Found</h3>
            <p className="text-xs text-plum/60 max-w-sm mx-auto leading-relaxed">
              {activeTab === 'active' 
                ? "You haven't created any active chit groups yet. Click 'Create Group' to initialize your first scheme." 
                : "There are no closed/archived groups in the database history."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-plum text-milk border-b border-plum/20">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Group Identity</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Chit Value</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Duration</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Installment Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {groups.map((group) => (
                  <tr 
                    key={group.id} 
                    className="hover:bg-plum hover:text-milk transition-all duration-200 ease-in-out cursor-pointer group active:bg-plum/95"
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    {/* Identity */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-plum text-milk flex items-center justify-center shadow-plum-sm group-hover:bg-milk group-hover:text-plum transition-colors duration-200">
                          <Landmark className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-plum group-hover:text-milk">{group.name}</div>
                          <div className="text-[10px] font-mono text-plum/60 group-hover:text-milk/70 mt-0.5 font-bold">ID: {group.id.split('-')[0]}</div>
                        </div>
                      </div>
                    </td>
                    {/* Value */}
                    <td className="px-6 py-5 text-right font-mono font-black text-sm text-plum group-hover:text-milk">
                      {formatCurrency(group.chit_amount)}
                    </td>
                    {/* Duration */}
                    <td className="px-6 py-5 text-center text-xs font-bold text-plum group-hover:text-milk">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <Clock className="w-3.5 h-3.5 opacity-60" />
                        {group.duration_months} Months
                      </div>
                    </td>
                    {/* Installment */}
                    <td className="px-6 py-5 text-right font-mono font-black text-sm text-plum group-hover:text-milk">
                      {formatCurrency(group.installment_amount)}
                    </td>
                    {/* Status badge */}
                    <td className="px-6 py-5 text-center">
                      {group.status === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold bg-plum text-milk border border-milk/10 group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 uppercase tracking-wider transition-colors duration-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold bg-milk text-plum border border-plum/10 group-hover:bg-plum group-hover:text-milk group-hover:border-milk/10 uppercase tracking-wider transition-colors duration-200">
                          Archived
                        </span>
                      )}
                    </td>
                    {/* Action Arrow */}
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 bg-plum text-milk rounded-lg border border-transparent group-hover:bg-milk group-hover:text-plum group-hover:border-plum/25 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-plum-sm hover:scale-105 active:scale-90">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={fetchGroups}
      />
    </div>
  );
}
