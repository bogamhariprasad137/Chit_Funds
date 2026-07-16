import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { formatCurrency } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/button";
import { Plus, Archive } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { CreateGroupModal } from "@/components/shared/CreateGroupModal";
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

export function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ChitGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchGroups = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("chit_groups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching groups:", error);
    } else {
      setGroups(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const activeGroups = groups.filter(g => g.status === 'active');
  const archivedGroups = groups.filter(g => g.status === 'archived');

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 display-font tracking-tight">
            Chit Groups
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage your active and archived chit funds.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>
      
      {/* Tabs & Table */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="active">Active Groups ({activeGroups.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived Groups ({archivedGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-900 min-w-[200px]">Name</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">Chit Amount</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">Duration</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">Members</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">Installment</TableHead>
                  <TableHead className="font-semibold text-slate-900">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Loading groups...</TableCell>
                  </TableRow>
                ) : activeGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">No active groups found.</TableCell>
                  </TableRow>
                ) : (
                  activeGroups.map((group) => (
                    <TableRow 
                      key={group.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      <TableCell className="font-semibold text-slate-900">
                        {group.name}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900 tabular-nums">
                        {formatCurrency(group.chit_amount)}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {group.duration_months} Months
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        <span className="font-medium text-slate-900">?</span> / {group.max_members}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900 tabular-nums">
                        {formatCurrency(group.installment_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className="font-semibold uppercase tracking-wider text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          {group.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="archived" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {archivedGroups.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-900 min-w-[200px]">Name</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Chit Amount</TableHead>
                    <TableHead className="font-semibold text-slate-900 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedGroups.map((group) => (
                    <TableRow 
                      key={group.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      <TableCell className="font-semibold text-slate-900">
                        {group.name}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900 tabular-nums">
                        {formatCurrency(group.chit_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-semibold uppercase tracking-wider text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200">
                          {group.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <Archive className="text-slate-400 w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No archived groups</h3>
              <p className="text-slate-500 max-w-sm text-center">
                Groups that have completed their duration and payouts will appear here.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateGroupModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchGroups}
      />
    </div>
  );
}
