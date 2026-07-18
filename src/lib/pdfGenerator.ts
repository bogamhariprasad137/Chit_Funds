import { jsPDF } from "jspdf";
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

  // Color Palette - Neutral slate and dark plum suited for black & white printing
  const primaryColor = "#371931"; // PLUM (#371931)
  const textColor = "#1e293b";
  const mutedTextColor = "#475569";
  const dividerColor = "#cbd5e1";

  // Border & Padding
  const margin = 10;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Title / Branded Header
  doc.setFont(fontName, "bold");
  doc.setFontSize(13);
  doc.setTextColor(primaryColor);
  doc.text(businessName.toUpperCase(), margin + 5, margin + 12);

  doc.setFont(fontName, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(mutedTextColor);
  doc.text("Official Payment Receipt", margin + 5, margin + 17);

  // Receipt meta (Top right)
  doc.setFont(fontName, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(textColor);
  const receiptStr = `Receipt No: ${payment.receipt_number}`;
  const receiptWidth = doc.getTextWidth(receiptStr);
  doc.text(receiptStr, pageWidth - margin - 5 - receiptWidth, margin + 12);

  doc.setFont(fontName, "normal");
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor);
  const payDate = payment.payment_date || payment.paid_at;
  
  let dateText = "Date: —";
  try {
    const d = new Date(payDate);
    if (!isNaN(d.getTime())) {
      dateText = `Date: ${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
    }
  } catch (err) {
    console.error("Error parsing date:", err);
  }
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, pageWidth - margin - 5 - dateWidth, margin + 17);

  // Thin separator line
  doc.setDrawColor(dividerColor);
  doc.setLineWidth(0.2);
  doc.line(margin + 5, margin + 22, pageWidth - margin - 5, margin + 22);

  // Transaction Info Header
  doc.setFont(fontName, "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor);
  doc.text("TRANSACTION DETAILS", margin + 5, margin + 29);

  const startY = margin + 35;
  const labelX = margin + 5;
  const valueX = margin + 45;
  let currentY = startY;

  const details = [
    { label: "Member Name:", value: payment.member_name || "N/A" },
    { label: "Phone Number:", value: payment.member_phone || payment.phone || "N/A" },
    { label: "Chit Group:", value: payment.group_name || "N/A" },
    { label: "Payment Mode:", value: (payment.payment_mode || "N/A").replace("_", " ").toUpperCase() },
  ];

  doc.setFontSize(8);
  details.forEach((d) => {
    doc.setFont(fontName, "bold");
    doc.setTextColor(textColor);
    doc.text(d.label, labelX, currentY);

    doc.setFont(fontName, "normal");
    doc.setTextColor(mutedTextColor);
    doc.text(d.value, valueX, currentY);
    currentY += 5.5;
  });

  // Divider above table
  doc.line(margin + 5, currentY + 1, pageWidth - margin - 5, currentY + 1);
  currentY += 7;

  // Financial Ledger Table Header
  doc.setFont(fontName, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryColor);
  doc.text("Item Description", labelX, currentY);
  
  const amountHeader = "Amount";
  const amountHeaderWidth = doc.getTextWidth(amountHeader);
  doc.text(amountHeader, pageWidth - margin - 5 - amountHeaderWidth, currentY);

  currentY += 2;
  doc.setLineWidth(0.25);
  doc.setDrawColor(textColor);
  doc.line(margin + 5, currentY, pageWidth - margin - 5, currentY);
  currentY += 6;

  // Items
  const items = [
    { label: "Chit Group Installment Contribution", value: Number(payment.installment_amount) || 0 },
    { label: "Accrued Late Overdue Penalty Fee", value: Number(payment.penalty_amount) || 0 },
  ];

  doc.setFontSize(8);
  items.forEach((item) => {
    doc.setFont(fontName, "normal");
    doc.setTextColor(textColor);
    doc.text(item.label, labelX, currentY);

    const valStr = formatCurrencyForPdf(item.value, hasCustomFont);
    const valWidth = doc.getTextWidth(valStr);
    doc.text(valStr, pageWidth - margin - 5 - valWidth, currentY);
    currentY += 6;
  });

  // Divider above Total
  doc.setDrawColor(dividerColor);
  doc.setLineWidth(0.2);
  doc.line(margin + 5, currentY - 1, pageWidth - margin - 5, currentY - 1);
  currentY += 4;

  // Total Paid Row
  doc.setFont(fontName, "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor);
  doc.text("TOTAL AMOUNT RECEIVED", labelX, currentY);

  const totalValStr = formatCurrencyForPdf(Number(payment.total_paid || payment.amount || 0), hasCustomFont);
  const totalValWidth = doc.getTextWidth(totalValStr);
  doc.text(totalValStr, pageWidth - margin - 5 - totalValWidth, currentY);

  currentY += 7;

  // Remarks if any
  if (payment.remarks) {
    doc.setFont(fontName, "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(mutedTextColor);
    doc.text(`Remarks: ${payment.remarks}`, labelX, currentY);
    currentY += 5.5;
  }

  // Footer Message
  doc.setFont(fontName, "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryColor);
  const thankYou = "Thank you for your payment!";
  const thankYouWidth = doc.getTextWidth(thankYou);
  doc.text(thankYou, (pageWidth - thankYouWidth) / 2, pageHeight - margin - 11);

  doc.setFont(fontName, "normal");
  doc.setFontSize(7);
  doc.setTextColor(mutedTextColor);
  const autoGenerated = "This is a computer-generated receipt and requires no physical signature.";
  const autoGeneratedWidth = doc.getTextWidth(autoGenerated);
  doc.text(autoGenerated, (pageWidth - autoGeneratedWidth) / 2, pageHeight - margin - 6);

  // Trigger browser download
  doc.save(`Receipt_${payment.receipt_number}.pdf`);
}
