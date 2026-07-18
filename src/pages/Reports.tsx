import { useState, useEffect } from "react";
import { format, startOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/formatCurrency";
import { Download, FileText, Loader2, TrendingUp, AlertCircle, Coins } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { setupPdfFonts, formatCurrencyForPdf } from "@/lib/pdfFont";

// Helper function to safely format dates without throwing RangeErrors on invalid dates
function safeFormatDate(dateVal: any, formatStr: string, fallback = "—") {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return format(d, formatStr);
  } catch {
    return fallback;
  }
}

export function Reports() {
  const [reportType, setReportType] = useState<string>("daily");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("ChitLedger");

  // Summary Metrics
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalReleased, setTotalReleased] = useState(0);

  useEffect(() => {
    async function loadSummaryStats() {
      try {
        // 1. Fetch total collected
        const { data: collectedData } = await supabase
          .from("active_payments_view")
          .select("total_paid");
        const sumCollected = collectedData?.reduce((sum, p) => sum + (Number(p.total_paid) || 0), 0) || 0;
        setTotalCollected(sumCollected);

        // 2. Fetch total pending
        const { data: pendingData } = await supabase
          .from("pending_installments_view")
          .select("total_due");
        const sumPending = pendingData?.reduce((sum, p) => sum + (Number(p.total_due) || 0), 0) || 0;
        setTotalPending(sumPending);

        // 3. Fetch total released
        const { data: releasedData } = await supabase
          .from("chit_releases")
          .select("amount");
        const sumReleased = releasedData?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
        setTotalReleased(sumReleased);
      } catch (err) {
        console.error("Error loading summary stats:", err);
      }
    }

    async function getSettings() {
      try {
        const { data } = await supabase.from('admin_settings').select('business_name').single();
        if (data?.business_name) {
          setBusinessName(data.business_name);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }
    }

    loadSummaryStats();
    getSettings();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      if (reportType === "daily") {
        const { data, error } = await supabase
          .from("active_payments_view")
          .select("paid_at, total_paid")
          .gte("paid_at", startDate.toISOString())
          .lte("paid_at", endDate.toISOString());

        if (error) throw error;
        
        const groupedMap: Record<string, { date: string; count: number; amount: number }> = {};
        data?.forEach((row: any) => {
          if (!row.paid_at) return;
          const dateStr = safeFormatDate(row.paid_at, "yyyy-MM-dd", "");
          if (!dateStr) return;
          
          if (!groupedMap[dateStr]) {
            groupedMap[dateStr] = { date: dateStr, count: 0, amount: 0 };
          }
          groupedMap[dateStr].count += 1;
          groupedMap[dateStr].amount += Number(row.total_paid) || 0;
        });

        const sorted = Object.values(groupedMap).sort((a, b) => b.date.localeCompare(a.date));
        setTableData(sorted);

      } else if (reportType === "monthly") {
        const { data, error } = await supabase
          .from("active_payments_view")
          .select(`
            paid_at,
            receipt_number,
            installment_month,
            installment_amount,
            penalty_amount,
            total_paid,
            payment_mode,
            members ( name ),
            chit_groups ( name )
          `)
          .gte("paid_at", startDate.toISOString())
          .lte("paid_at", endDate.toISOString())
          .order("paid_at", { ascending: false });

        if (error) throw error;
        setTableData(data || []);

      } else if (reportType === "defaulters") {
        const { data, error } = await supabase
          .from("pending_installments_view")
          .select("*");

        if (error) throw error;

        const filtered = (data || []).filter((row: any) => {
          if (!row.installment_month) return false;
          const mDate = new Date(row.installment_month);
          if (isNaN(mDate.getTime())) return false;
          
          const checkStartDate = new Date(startDate);
          checkStartDate.setHours(0,0,0,0);
          const checkEndDate = new Date(endDate);
          checkEndDate.setHours(23,59,59,999);
          return mDate >= checkStartDate && mDate <= checkEndDate;
        });

        setTableData(filtered);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType]);

  const downloadPDF = async () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    // Load custom fonts to support the ₹ unicode character
    const hasCustomFont = await setupPdfFonts(doc);
    const fontName = hasCustomFont ? "Roboto" : "helvetica";
    doc.setFont(fontName, "normal");
    
    // 1. Company Name (Large, Bold, Dark Plum text)
    doc.setFont(fontName, "bold");
    doc.setFontSize(16);
    doc.setTextColor(55, 25, 49); // PLUM (#371931)
    doc.text(businessName.toUpperCase(), 15, 20);
    
    // 2. Report Name (Medium, Bold, Dark Plum text)
    doc.setFontSize(11);
    doc.setFont(fontName, "bold");
    doc.setTextColor(55, 25, 49);
    doc.text(
      reportType === "daily" 
        ? "DAILY COLLECTIONS REPORT" 
        : reportType === "monthly" 
          ? "MONTHLY DETAILED LEDGER" 
          : "OUTSTANDING DEFAULTERS LIST", 
      15, 26
    );
    
    // 3. Metadata (Regular, Slate Gray text)
    doc.setFontSize(8.5);
    doc.setFont(fontName, "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Audit Date Range: ${safeFormatDate(startDate, "dd MMM yyyy")} - ${safeFormatDate(endDate, "dd MMM yyyy")}`, 15, 32);
    doc.text(`Generated Timestamp: ${safeFormatDate(new Date(), "dd MMM yyyy, hh:mm a")}`, 15, 36);
    
    // Thin horizontal line separating header metadata from the table grid
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.line(15, 40, 195, 40);

    let headers: string[] = [];
    let body: any[] = [];
    let foot: any[] = [];

    if (reportType === "daily") {
      headers = ["Collection Date", "Receipts Logged", "Total Collections"];
      body = tableData.map((row: any) => [
        safeFormatDate(row.date, "dd MMM yyyy"),
        `${row.count} payments`,
        formatCurrencyForPdf(row.amount, hasCustomFont)
      ]);

      const totalSum = tableData.reduce((sum, row) => sum + Number(row.amount || 0), 0);
      foot = [["Total Collections Summary", "", formatCurrencyForPdf(totalSum, hasCustomFont)]];

    } else if (reportType === "monthly") {
      headers = ["Date", "Member Name", "Chit Group", "Receipt No", "Installment Period", "Payment Mode", "Total Paid"];
      body = tableData.map((row: any) => [
        safeFormatDate(row.paid_at, "dd MMM yyyy"),
        row.members?.name || "Unknown",
        row.chit_groups?.name || "Unknown",
        row.receipt_number || "—",
        safeFormatDate(row.installment_month, "MMM yyyy"),
        row.payment_mode ? row.payment_mode.replace('_', ' ').toUpperCase() : "—",
        formatCurrencyForPdf(row.total_paid, hasCustomFont)
      ]);

      const totalSum = tableData.reduce((sum, row) => sum + Number(row.total_paid || 0), 0);
      foot = [["Total Ledger Summary", "", "", "", "", "", formatCurrencyForPdf(totalSum, hasCustomFont)]];

    } else if (reportType === "defaulters") {
      headers = ["Member Name", "Chit Group", "Installment Month", "Accrued Penalty", "Total Outstanding"];
      body = tableData.map((row: any) => [
        row.member_name || "Unknown",
        row.group_name || "Unknown",
        safeFormatDate(row.installment_month, "MMM yyyy"),
        formatCurrencyForPdf(row.penalty_amount, hasCustomFont),
        formatCurrencyForPdf(row.total_due, hasCustomFont)
      ]);

      const totalPenalty = tableData.reduce((sum, row) => sum + Number(row.penalty_amount || 0), 0);
      const totalOutstanding = tableData.reduce((sum, row) => sum + Number(row.total_due || 0), 0);
      foot = [["Total Defaulters Summary", "", "", formatCurrencyForPdf(totalPenalty, hasCustomFont), formatCurrencyForPdf(totalOutstanding, hasCustomFont)]];
    }

    autoTable(doc, {
      startY: 44,
      margin: { left: 15, right: 15 },
      head: [headers],
      body: body,
      foot: foot.length > 0 ? foot : undefined,
      theme: "plain", // No colored cell backgrounds
      styles: {
        font: fontName,
        fontSize: 8,
        cellPadding: 3.5,
        valign: "middle",
        lineColor: [180, 180, 180], // Thin gray gridlines
        lineWidth: 0.15,
        textColor: [55, 25, 49]
      },
      headStyles: {
        fillColor: [255, 255, 255], // Pure white table header background
        textColor: [55, 25, 49], // Dark plum text (#371931)
        fontStyle: "bold",
        fontSize: 8.5,
        lineWidth: 0.15,
        lineColor: [180, 180, 180] // Thin borders around header cells
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255] // Pure white body rows, no alternate backgrounds
      },
      footStyles: {
        fillColor: [255, 255, 255], // Pure white summary footer row
        textColor: [55, 25, 49],
        fontStyle: "bold",
        lineWidth: 0.25, // Slightly thicker border line for summary
        lineColor: [55, 25, 49],
        fontSize: 8
      },
      columnStyles: reportType === "monthly" ? {
        0: { cellWidth: 20 },
        1: { cellWidth: 32 },
        2: { cellWidth: 22 },
        3: { cellWidth: 26 },
        4: { cellWidth: 28 },
        5: { cellWidth: 27 },
        6: { cellWidth: 25, halign: "right" }
      } : reportType === "daily" ? {
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: "center" },
        2: { cellWidth: 70, halign: "right" }
      } : {
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35, halign: "center" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: 35, halign: "right" }
      },
      didDrawPage: () => {
        // Professional minimal footer
        const str = "Page " + doc.getNumberOfPages();
        doc.setFont(fontName, "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(55, 25, 49, 0.5);
        doc.text(str, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
        doc.text(
          `Generated by ${businessName.toUpperCase()} Management System`,
          15,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save(`${reportType}_report_${safeFormatDate(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 bg-milk text-plum font-body-md">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-plum tracking-tight">Financial Reports</h1>
          <p className="text-sm font-medium text-plum/60 mt-1 font-outfit">Audit pool cash flows and generate exportable summaries.</p>
        </div>
      </div>

      {/* Filter Options Controls Card */}
      <div className="bg-milk p-5 border border-plum/20 rounded-lg shadow-plum-sm flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Report Type Selector */}
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-xs font-bold text-plum/70 uppercase tracking-wider">Report type</label>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-milk border border-plum/25 focus:border-plum rounded-lg text-sm font-bold focus:outline-none transition-all duration-200 text-plum appearance-none focus:ring-2 focus:ring-plum/10 cursor-pointer shadow-plum-sm"
              >
                <option value="daily">Daily Collections</option>
                <option value="monthly">Monthly Detailed Ledger</option>
                <option value="defaulters">Defaulters List</option>
              </select>
            </div>
          </div>

          {/* Date Picker Start */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-plum/70 uppercase tracking-wider">Start date</label>
            <input
              type="date"
              value={safeFormatDate(startDate, "yyyy-MM-dd", "")}
              onChange={(e) => e.target.value && setStartDate(new Date(e.target.value))}
              className="px-3.5 py-2.5 input-milk font-mono shadow-plum-sm"
            />
          </div>

          {/* Separator */}
          <span className="text-plum/50 text-sm hidden md:inline self-center mb-3 font-bold select-none">to</span>

          {/* Date Picker End */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-plum/70 uppercase tracking-wider">End date</label>
            <input
              type="date"
              value={safeFormatDate(endDate, "yyyy-MM-dd", "")}
              onChange={(e) => e.target.value && setEndDate(new Date(e.target.value))}
              className="px-3.5 py-2.5 input-milk font-mono shadow-plum-sm"
            />
          </div>
        </div>

        <button 
          onClick={generateReport}
          className="btn-plum px-5 py-3 h-[46px] flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* KPI Grid Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Collected */}
        <div className="card-milk p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1.5 font-geist">Total Collections</p>
            <h3 className="text-2xl font-black text-plum font-mono tracking-tight">{formatCurrency(totalCollected)}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-plum flex items-center justify-center text-milk border border-milk/10 shadow-milk-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Pending */}
        <div className="card-milk p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1.5 font-geist">Total Outstanding</p>
            <h3 className="text-2xl font-black font-mono tracking-tight text-plum">{formatCurrency(totalPending)}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-plum flex items-center justify-center text-milk border border-milk/10 shadow-milk-sm">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Total Released */}
        <div className="card-milk p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-plum/60 uppercase tracking-widest mb-1.5 font-geist">Disbursed Release Prize</p>
            <h3 className="text-2xl font-black text-plum font-mono tracking-tight">{formatCurrency(totalReleased)}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-plum flex items-center justify-center text-milk border border-milk/10 shadow-milk-sm">
            <Coins className="w-5 h-5" />
          </div>
        </div>

      </section>

      {/* Main Table Card wrapper with hover elevation */}
      <div className="card-milk min-h-[300px] overflow-hidden hover:-translate-y-0.5">
        {/* Table Toolbar */}
        <div className="px-6 py-4 bg-plum text-milk border-b border-plum/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h4 className="text-sm font-bold capitalize">
              {reportType === "defaulters" ? "Outstanding Overdue List" : `${reportType} audit data`}
            </h4>
            <p className="text-[11px] text-milk/70 mt-0.5 font-bold">Calculated results for parameters selected above.</p>
          </div>
          {tableData.length > 0 && (
            <button 
              onClick={downloadPDF}
              className="btn-milk px-4 py-2.5 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Audit PDF
            </button>
          )}
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-plum" />
            </div>
          ) : tableData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-milk space-y-3">
              <AlertCircle className="w-10 h-10 text-plum opacity-40 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-plum mb-1">No Records Found</h3>
                <p className="text-xs text-plum/60">
                  No matching transactional audits found for the specified period.
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-plum text-milk border-b border-plum/20">
                {reportType === "daily" && (
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Payment Collection Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Number of Payments</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Total Collected</th>
                  </tr>
                )}
                {reportType === "monthly" && (
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Date Recorded</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Member Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Group Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Receipt No</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Installment Month</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Mode</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Total Paid</th>
                  </tr>
                )}
                {reportType === "defaulters" && (
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Member Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Group Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Installment Period</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Accrued Penalty</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">Total Due Balance</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-plum/10 bg-milk text-plum">
                {tableData.map((row, index) => (
                  <tr key={index} className="hover:bg-plum hover:text-milk transition-all duration-200 ease-in-out cursor-pointer group active:bg-plum/95">
                    {reportType === "daily" && (
                      <>
                        <td className="px-6 py-4 font-mono text-xs font-bold">
                          {safeFormatDate(row.date, "dd MMM yyyy")}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold opacity-80 group-hover:opacity-100">
                          {row.count} payments
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-sm text-right">
                          {formatCurrency(row.amount)}
                        </td>
                      </>
                    )}
                    {reportType === "monthly" && (
                      <>
                        <td className="px-6 py-4 font-mono text-xs opacity-75">
                          {safeFormatDate(row.paid_at, "dd MMM yyyy")}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold">
                          {row.members?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          {row.chit_groups?.name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold">
                          {row.receipt_number || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 bg-plum/5 border border-plum/20 rounded-lg text-[10px] font-bold font-mono text-plum uppercase group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 transition-colors duration-200">
                            {safeFormatDate(row.installment_month, "MMM yyyy")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 bg-plum/5 border border-plum/20 rounded-lg text-[10px] font-bold text-plum uppercase group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 transition-colors duration-200">
                            {row.payment_mode ? row.payment_mode.replace('_', ' ') : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-sm text-right">
                          {formatCurrency(row.total_paid)}
                        </td>
                      </>
                    )}
                    {reportType === "defaulters" && (
                      <>
                        <td className="px-6 py-4 text-sm font-bold">
                          {row.member_name || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          {row.group_name || "Unknown"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 bg-plum/5 border border-plum/20 rounded-lg text-[10px] font-bold font-mono text-plum uppercase group-hover:bg-milk group-hover:text-plum group-hover:border-plum/10 transition-colors duration-200">
                            {safeFormatDate(row.installment_month, "MMM yyyy")}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-right font-bold group-hover:text-milk">
                          {row.penalty_amount > 0 ? formatCurrency(row.penalty_amount) : "—"}
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-sm text-right">
                          {formatCurrency(row.total_due)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
