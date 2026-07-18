import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, Search, User, ArrowRight, Landmark } from "lucide-react";
import { useNavigate } from "react-router";
import { AddMemberModal } from "@/components/shared/AddMemberModal";

export function Members() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        chit_groups ( name )
      `)
      .order('name');

    if (!error && data) {
      setMembers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 bg-milk text-plum font-body-md">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum tracking-tight">Members Directory</h1>
          <p className="text-sm font-medium text-plum/60 mt-1 font-outfit">Manage and audit member profiles and contact details.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-plum px-5 py-3 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Toolbar / Search Bar */}
      <div className="flex items-center gap-4 bg-milk p-4 border border-plum/20 rounded-lg shadow-plum-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm input-milk shadow-plum-sm" 
            placeholder="Search members by name or phone..." 
            type="text"
          />
        </div>
        
        <span className="text-xs font-bold text-plum bg-milk border border-plum/25 px-3 py-1 rounded-lg uppercase tracking-wider hidden sm:inline-block select-none">
          {filteredMembers.length} record{filteredMembers.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Data Table Section with hover elevation wrapper */}
      <div className="card-milk min-h-[300px] overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-plum" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-14 h-14 bg-plum/5 border border-plum/15 rounded-lg flex items-center justify-center mb-4 shadow-plum-sm">
              <User className="w-6 h-6 text-plum" />
            </div>
            <h3 className="text-base font-bold text-plum mb-1">No Members Registered</h3>
            <p className="text-xs text-plum/60 max-w-sm mx-auto leading-relaxed">
              Start building your system registry. Click 'Add Member' to enroll a user into a chit group.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <h3 className="text-base font-bold text-plum mb-1">No Matches Found</h3>
            <p className="text-xs text-plum/60">
              Your search for "{searchQuery}" did not return any records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-plum text-milk border-b border-plum/20">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Member Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Phone number</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Assigned Group</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Registry Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {filteredMembers.map((member) => (
                  <tr 
                    key={member.id} 
                    onClick={() => navigate(`/members/${member.id}`)}
                    className="hover:bg-plum hover:text-milk transition-all duration-200 ease-in-out cursor-pointer group active:bg-plum/95"
                  >
                    {/* Name/Avatar info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-plum text-milk flex items-center justify-center font-bold shadow-plum-sm group-hover:bg-milk group-hover:text-plum transition-colors duration-200 uppercase text-xs">
                          {member.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-plum group-hover:text-milk">{member.name}</p>
                          <p className="text-[10px] text-plum/60 group-hover:text-milk/60 mt-0.5 font-bold">Enrolled: {new Date(member.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    {/* Contact Monospace */}
                    <td className="px-6 py-4 font-mono text-xs font-bold">
                      {member.phone}
                    </td>
                    {/* Associated Group */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-milk border border-plum/25 rounded-lg text-xs font-bold text-plum group-hover:bg-plum group-hover:text-milk group-hover:border-milk/10 transition-colors duration-200 shadow-plum-sm group-hover:shadow-milk-sm">
                        <Landmark className="w-3.5 h-3.5 opacity-60" />
                        {member.chit_groups?.name || 'Unassigned'}
                      </div>
                    </td>
                    {/* Active Status Badge */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold bg-plum text-milk border border-milk/10 group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 uppercase tracking-wide transition-colors duration-200">
                        Active Member
                      </span>
                    </td>
                    {/* Chevron Arrow Action */}
                    <td className="px-6 py-4 text-right">
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

      <AddMemberModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={fetchMembers}
      />
    </div>
  );
}
