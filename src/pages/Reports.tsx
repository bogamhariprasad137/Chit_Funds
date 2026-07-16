import { formatCurrency } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar as CalendarIcon, Filter, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MOCK_REPORTS = [
  {
    id: 1,
    name: "Monthly Collection Summary",
    dateRange: "Oct 1 - Oct 31, 2023",
    type: "PDF",
  },
  {
    id: 2,
    name: "Quarterly Audit",
    dateRange: "Jul 1 - Sep 30, 2023",
    type: "Excel",
  }
];

export function Reports() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 display-font tracking-tight">
            Financial Reports
          </h1>
          <p className="text-slate-500 font-medium mt-1">Generate and export system-wide financial summaries.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto border-slate-200 bg-white text-slate-700 justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Oct 1, 2023 - Oct 31, 2023</span>
            </Button>
          </div>
          <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(250000)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Total Pending</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(45000)}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-slate-400">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-1">Total Released</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(150000)}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Reports</h2>
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-500">Report Name</TableHead>
                <TableHead className="font-semibold text-slate-500">Date Range</TableHead>
                <TableHead className="font-semibold text-slate-500">Type</TableHead>
                <TableHead className="font-semibold text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_REPORTS.map((item) => (
                <TableRow key={item.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                  <TableCell className="font-semibold text-slate-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {item.dateRange}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={`
                        ${item.type === 'PDF' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100/80' : ''}
                        ${item.type === 'Excel' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80' : ''}
                        border-transparent
                      `}
                    >
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
