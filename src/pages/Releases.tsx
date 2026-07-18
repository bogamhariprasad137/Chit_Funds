import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatCurrency";
import { Search, Loader2, Landmark, Clock, Coins } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RecordReleaseModal } from "@/components/shared/RecordReleaseModal";

type ReleaseRow = {
  id: string;
  group_id: string;
  member_id: string;
  release_month: string;
  amount: number;
  payment_mode: string;
  released_at: string;
  members?: { name: string };
  chit_groups?: { name: string };
};

export function Releases() {
  const [releases, setReleases] = useState<ReleaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchReleases();
  }, []);

  async function fetchReleases() {
    setLoading(true);
    const { data, error } = await supabase
      .from("chit_releases")
      .select(`
        *,
        members(name),
        chit_groups(name)
      `)
      .order("released_at", { ascending: false });

    if (error) {
      console.error(error);
    } else if (data) {
      setReleases(data as any);
    }
    setLoading(false);
  }

  const filteredReleases = releases.filter(r => 
    r.members?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.chit_groups?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 bg-milk text-plum font-body-md">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum tracking-tight">Chit Payout Releases</h1>
          <p className="text-sm font-medium text-plum/60 mt-1 font-outfit">Audit log of pool prize releases to scheme winners.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-plum px-5 py-3 flex items-center justify-center gap-2"
        >
          Record Release
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center gap-4 bg-milk p-4 border border-plum/20 rounded-lg shadow-plum-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm input-milk shadow-plum-sm" 
            placeholder="Search releases by group or winner..." 
            type="text"
          />
        </div>
        
        <span className="text-xs font-bold text-plum bg-milk border border-plum/25 px-3 py-1 rounded-lg uppercase tracking-wider hidden sm:inline-block select-none">
          {filteredReleases.length} payout{filteredReleases.length !== 1 ? 's' : ''} audited
        </span>
      </div>

      {/* Main Table Card with hover elevation wrapper */}
      <div className="card-milk min-h-[300px] overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-plum" />
          </div>
        ) : filteredReleases.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-14 h-14 bg-plum/5 border border-plum/15 rounded-lg flex items-center justify-center mb-4 text-plum shadow-plum-sm">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-plum mb-1">No Payout Releases Registered</h3>
            <p className="text-xs text-plum/60 max-w-sm mx-auto leading-relaxed">
              Closed auctions or prize disbursements will show up here once recorded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-plum text-milk border-b border-plum/20">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Group</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Month Release</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Winner Member</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Payment Mode</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Released Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Audit Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {filteredReleases.map((item) => (
                  <tr key={item.id} className="hover:bg-plum hover:text-milk transition-all duration-200 ease-in-out cursor-pointer group active:bg-plum/95">
                    {/* Group */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 opacity-60" />
                        <span className="text-sm font-bold">{item.chit_groups?.name}</span>
                      </div>
                    </td>
                    {/* Month */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 opacity-60" />
                        {new Date(item.release_month).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}
                      </span>
                    </td>
                    {/* Winner */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-plum text-milk border border-milk/10 flex items-center justify-center font-bold text-xs shadow-milk-sm uppercase group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 transition-colors duration-200">
                          {item.members?.name.substring(0, 2)}
                        </div>
                        <span className="text-sm font-bold">{item.members?.name}</span>
                      </div>
                    </td>
                    {/* Payment Mode */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-plum/5 border border-plum/15 text-plum text-[10px] font-bold rounded-lg uppercase group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 transition-colors duration-200">
                        {item.payment_mode.replace('_', ' ')}
                      </span>
                    </td>
                    {/* Amount */}
                    <td className="px-6 py-4 font-mono font-black text-sm text-right">
                      {formatCurrency(item.amount)}
                    </td>
                    {/* Date */}
                    <td className="px-6 py-4 font-mono text-xs text-right opacity-80 group-hover:opacity-100">
                      {new Date(item.released_at).toLocaleDateString(undefined, {day: '2-digit', month: 'short', year: 'numeric'})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RecordReleaseModal 
        open={isModalOpen}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchReleases}
      />
    </div>
  );
}
