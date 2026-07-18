import { jsPDF } from "jspdf";
import { formatCurrency } from "@/lib/formatCurrency";

let robotoRegularBase64: string | null = null;
let robotoBoldBase64: string | null = null;

async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font: HTTP ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();

  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function setupPdfFonts(doc: jsPDF): Promise<boolean> {
  try {
    if (!robotoRegularBase64) {
      robotoRegularBase64 = await fetchFontAsBase64(
        "https://cdn.jsdelivr.net/npm/roboto-fontface@0.10.0/fonts/roboto/Roboto-Regular.ttf"
      );
    }
    if (!robotoBoldBase64) {
      robotoBoldBase64 = await fetchFontAsBase64(
        "https://cdn.jsdelivr.net/npm/roboto-fontface@0.10.0/fonts/roboto/Roboto-Bold.ttf"
      );
    }

    doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

    doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

    return true;
  } catch (err) {
    console.warn("Failed to load custom web fonts for PDF, using standard system fallback fonts:", err);
    return false;
  }
}

export function formatCurrencyForPdf(amount: number, _hasCustomFont: boolean): string {
  const formatted = formatCurrency(amount);
  // Replace non-breaking spaces with normal spaces to prevent formatting spacing issues
  return formatted.replace(/\u00a0/g, " ");
}
