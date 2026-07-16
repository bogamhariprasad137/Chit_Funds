import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, HandCoins, Trash2, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type ChitGroup = Database["public"]["Tables"]["chit_groups"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

export function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [group, setGroup] = useState<ChitGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setIsLoading(true);

      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from("chit_groups")
        .select("*")
        .eq("id", id)
        .single();

      if (groupError) {
        console.error("Error fetching group:", groupError);
      } else {
        setGroup(groupData);
      }

      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: true });

      if (membersError) {
        console.error("Error fetching members:", membersError);
      } else if (membersData) {
        setMembers(membersData);
      }

      setIsLoading(false);
    }

    fetchData();
  }, [id]);

  if (isLoading) {
    return <div className="w-full text-center py-12 text-slate-500">Loading group details...</div>;
  }

  if (!group) {
    return <div className="w-full text-center py-12 text-slate-500">Group not found.</div>;
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="w-10 h-10 border-slate-200"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 display-font tracking-tight">
              {group.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`uppercase tracking-wider text-[10px] ${group.status === 'active' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {group.status}
              </Badge>
              <span className="text-sm font-medium text-slate-500">
                {group.duration_months} Months • {formatCurrency(group.installment_amount)} / month
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 text-slate-900 font-semibold" disabled>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Group
          </Button>
          <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold" disabled>
            <HandCoins className="w-4 h-4 mr-2" />
            Record Release
          </Button>
          <Button variant="destructive" className="font-semibold" disabled>
            <Trash2 className="w-4 h-4 mr-2" />
            Close Group
          </Button>
        </div>
      </div>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Chit Amount</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(group.chit_amount)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Total Members</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{members.length} / {group.max_members}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Grace Period</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{group.grace_period_days} Days</p>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="ledger">Ledger (Coming Soon)</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-900">Name</TableHead>
                    <TableHead className="font-semibold text-slate-900">Phone</TableHead>
                    <TableHead className="font-semibold text-slate-900">Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow 
                      key={m.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/members/${m.id}`)}
                    >
                      <TableCell className="font-semibold text-slate-900">
                        {m.name}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {m.phone}
                      </TableCell>
                      <TableCell className="text-slate-600 tabular-nums">
                        {new Date(m.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 space-y-3 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Users className="text-slate-400 w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No members yet</h3>
              <p className="text-slate-500 max-w-sm">
                Add members to this group from the Members page to start collecting payments.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ledger" className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500 font-medium">Ledger data integration will be part of Phase 4.2.</p>
        </TabsContent>
      </Tabs>

    </div>
  );
}
