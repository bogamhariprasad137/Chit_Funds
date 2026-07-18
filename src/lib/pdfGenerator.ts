import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { FontStyle } from "jspdf-autotable";
import { supabase } from "@/lib/supabase";
import { setupPdfFonts, formatCurrencyForPdf } from "@/lib/pdfFont";

export async function generateReceiptPDF(payment: any) {
  // Fetch admin settings for business name
  const { data: settings } = await supabase
    .from("admin_settings")
    .select("business_name")
    .single();

  const businessName = settings?.business_name || "ChitLedger Admin";

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5", // Receipt fits nicely on A5
  });

  // Load custom fonts to support the ₹ unicode character
  const hasCustomFont = await setupPdfFonts(doc);
  const fontName = hasCustomFont ? "Roboto" : "helvetica";
  doc.setFont(fontName, "normal");

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header Banner
  doc.setFont(fontName, "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // Corporate Navy (#1E293B)
  const headerText = "CHITLEDGER FINANCIAL SUITE";
  const headerWidth = doc.getTextWidth(headerText);
  doc.text(headerText, (pageWidth - headerWidth) / 2, 14);

  doc.setFont(fontName, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate Muted
  const subText = `OFFICIAL TRANSACTION RECEIPT - ${businessName.toUpperCase()}`;
  const subWidth = doc.getTextWidth(subText);
  doc.text(subText, (pageWidth - subWidth) / 2, 19);

  // Horizontal dividing rule
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.line(15, 23, pageWidth - 15, 23);

  // Format Date
  const payDate = payment.payment_date || payment.paid_at;
  let formattedDate = "—";
  try {
    const d = new Date(payDate);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
  } catch (err) {
    console.error("Error parsing date:", err);
  }

  // Metadata Grid (Clean, borderless two-column autoTable layout)
  const navyColor = [30, 41, 59] as [number, number, number];
  
  const metaData = [
    [
      { content: "Receipt Number:", styles: { fontStyle: "bold" as FontStyle, textColor: navyColor } },
      { content: payment.receipt_number || "—" },
      { content: "Member Name:", styles: { fontStyle: "bold" as FontStyle, textColor: navyColor } },
      { content: payment.member_name || "—" }
    ],
    [
      { content: "Date:", styles: { fontStyle: "bold" as FontStyle, textColor: navyColor } },
      { content: formattedDate },
      { content: "Phone Number:", styles: { fontStyle: "bold" as FontStyle, textColor: navyColor } },
      { content: payment.member_phone || payment.phone || "—" }
    ],
    [
      { content: "Chit Group:", styles: { fontStyle: "bold" as FontStyle, textColor: navyColor } },
      { content: payment.group_name || "—" },
      { content: "Payment Mode:", styles: { fontStyle: "bold" as FontStyle, textColor: navyColor } },
      { content: (payment.payment_mode || "—").replace("_", " ").toUpperCase() }
    ]
  ];

  autoTable(doc, {
    startY: 28,
    margin: { left: 15, right: 15 },
    body: metaData,
    theme: "plain",
    styles: {
      font: fontName,
      fontSize: 8,
      cellPadding: 1.5,
      textColor: [71, 85, 105] as [number, number, number],
      valign: "middle"
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 34 },
      2: { cellWidth: 25 },
      3: { cellWidth: 34 }
    }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 6;

  // Financial Table
  const financialHeaders = ["Item Description", "Amount (₹)"];
  const financialRows = [
    ["Chit Group Installment Contribution", formatCurrencyForPdf(Number(payment.installment_amount) || 0, hasCustomFont)],
    ["Accrued Late Overdue Penalty Fee", formatCurrencyForPdf(Number(payment.penalty_amount) || 0, hasCustomFont)]
  ];
  
  const totalAmountStr = formatCurrencyForPdf(Number(payment.total_paid || payment.amount || 0), hasCustomFont);

  autoTable(doc, {
    startY: nextY,
    margin: { left: 15, right: 15 },
    head: [financialHeaders],
    body: financialRows,
    foot: [
      ["TOTAL AMOUNT RECEIVED", totalAmountStr]
    ],
    theme: "striped",
    styles: {
      font: fontName,
      fontSize: 8,
      cellPadding: 3,
      valign: "middle",
      lineColor: [226, 232, 240] as [number, number, number],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [30, 41, 59] as [number, number, number], // Corporate Navy/Slate (#1E293B)
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: "bold",
      fontSize: 8.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] as [number, number, number]
    },
    footStyles: {
      fillColor: [241, 245, 249] as [number, number, number],
      textColor: [15, 23, 42] as [number, number, number],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "right"
    },
    columnStyles: {
      0: { cellWidth: 83 },
      1: { cellWidth: 35, halign: "right" }
    }
  });

  let footerY = (doc as any).lastAutoTable.finalY + 6;

  // Remarks if any
  if (payment.remarks) {
    doc.setFont(fontName, "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Remarks: ${payment.remarks}`, 15, footerY);
    footerY += 6;
  }

  // Footer Message
  doc.setFont(fontName, "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  
  const line1 = "Thank you for your payment!";
  const line2 = "This is a computer-generated receipt and requires no physical signature.";
  
  const line1Width = doc.getTextWidth(line1);
  const line2Width = doc.getTextWidth(line2);
  
  doc.text(line1, (pageWidth - line1Width) / 2, pageHeight - 16);
  doc.text(line2, (pageWidth - line2Width) / 2, pageHeight - 11);

  // Trigger browser download
  doc.save(`Receipt_${payment.receipt_number}.pdf`);
}
