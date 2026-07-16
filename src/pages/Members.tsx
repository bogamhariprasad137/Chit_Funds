import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AddMemberModal } from "@/components/shared/AddMemberModal";
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
  chit_groups: { name: string; status: string } | null;
};

export function Members() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberWithGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMembers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select(`
        id,
        name,
        phone,
        group_id,
        chit_groups ( name, status )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching members:", error);
    } else {
      // @ts-ignore
      setMembers(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 display-font tracking-tight">
            Members
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage your participants and view their standings.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Search members by name or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-slate-900"
          />
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-900 min-w-[200px]">Name</TableHead>
                <TableHead className="font-semibold text-slate-900">Phone</TableHead>
                <TableHead className="font-semibold text-slate-900 min-w-[200px]">Associated Group</TableHead>
                <TableHead className="font-semibold text-slate-900">Group Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">Loading members...</TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">No members found.</TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow 
                    key={member.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/members/${member.id}`)}
                  >
                    <TableCell className="font-semibold text-slate-900">
                      {member.name}
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium tabular-nums">
                      {member.phone}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {member.chit_groups?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`font-semibold uppercase tracking-wider text-[10px] ${
                          member.chit_groups?.status === 'active' 
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {member.chit_groups?.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddMemberModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchMembers}
      />
    </div>
  );
}
