import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatCurrency";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, PenLine, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RecordReleaseModal } from "@/components/shared/RecordReleaseModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 display-font tracking-tight">
            Chit Releases
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage monthly payouts to chit winners.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
            <PenLine className="w-4 h-4 mr-2" />
            Record Release
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by group or member..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-500">Group</TableHead>
                <TableHead className="font-semibold text-slate-500">Month</TableHead>
                <TableHead className="font-semibold text-slate-500">Winner</TableHead>
                <TableHead className="font-semibold text-slate-500">Mode</TableHead>
                <TableHead className="font-semibold text-slate-500 text-right">Amount</TableHead>
                <TableHead className="font-semibold text-slate-500 text-right">Date Recorded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : filteredReleases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    No releases found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReleases.map((item) => (
                  <TableRow key={item.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                    <TableCell className="font-semibold text-slate-900">
                      {item.chit_groups?.name}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(item.release_month), "MMM yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {item.members?.name}
                    </TableCell>
                    <TableCell className="capitalize text-slate-600">
                      {item.payment_mode.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="text-right text-slate-900 tabular-nums font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-right text-slate-600 tabular-nums text-sm">
                      {format(new Date(item.released_at), "dd MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <RecordReleaseModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchReleases}
      />
    </div>
  );
}
