import { formatCurrency, formatDate } from "@/lib/format";
import type { LineItem, Region } from "@/lib/types/database";

export interface PdfDocument {
  variant: "estimate" | "invoice";
  documentNumber: string;
  date: string;
  dueDate?: string | null;
  company: {
    businessName: string;
    address: string | null;
    phone: string | null;
    email: string;
    vatNumber: string | null;
    logoUrl: string | null;
    accentColour: string | null;
    region: Region;
  };
  customerName: string;
  customerAddress?: string | null;
  jobTitle?: string | null;
  summary?: string | null;
  lineItems: LineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c)
  );
}

/** Render an estimate or invoice as a self-contained HTML page for PDF printing. */
export function renderDocumentHtml(doc: PdfDocument): string {
  const region = doc.company.region;
  const accent = doc.company.accentColour ?? "#0f766e";
  const heading = doc.variant === "invoice" ? "INVOICE" : "QUOTE";

  const rows = doc.lineItems
    .map(
      (li) => `<tr>
        <td>${escapeHtml(li.description)}</td>
        <td class="num">${li.quantity}</td>
        <td class="num">${formatCurrency(li.unit_price, region)}</td>
        <td class="num">${formatCurrency(li.line_total, region)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 40px; font-size: 13px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .brand { font-size: 18px; font-weight: 700; }
  .brand img { max-height: 48px; }
  .muted { color: #64748b; }
  .doc-title { text-align: right; }
  .doc-title h1 { margin: 0; font-size: 24px; letter-spacing: 1px; color: ${accent}; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 24px; gap: 24px; }
  .meta h3 { margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
  .summary { margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; border-bottom: 2px solid #e2e8f0; padding: 8px 6px; }
  td { padding: 8px 6px; border-bottom: 1px solid #eef2f7; }
  .num { text-align: right; }
  .totals { width: 240px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { border-top: 2px solid #e2e8f0; margin-top: 6px; padding-top: 8px; font-weight: 700; font-size: 15px; }
  .foot { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
</style></head><body>
  <div class="top">
    <div class="brand">
      ${
        doc.company.logoUrl
          ? `<img src="${escapeHtml(doc.company.logoUrl)}" alt="${escapeHtml(doc.company.businessName)}" />`
          : escapeHtml(doc.company.businessName)
      }
    </div>
    <div class="doc-title">
      <h1>${heading}</h1>
      <div class="muted">${escapeHtml(doc.documentNumber)}</div>
    </div>
  </div>

  <div class="meta">
    <div>
      <h3>From</h3>
      <div><strong>${escapeHtml(doc.company.businessName)}</strong></div>
      ${doc.company.address ? `<div class="muted">${escapeHtml(doc.company.address)}</div>` : ""}
      ${doc.company.phone ? `<div class="muted">${escapeHtml(doc.company.phone)}</div>` : ""}
      <div class="muted">${escapeHtml(doc.company.email)}</div>
      ${doc.company.vatNumber ? `<div class="muted">VAT: ${escapeHtml(doc.company.vatNumber)}</div>` : ""}
    </div>
    <div>
      <h3>To</h3>
      <div><strong>${escapeHtml(doc.customerName)}</strong></div>
      ${doc.customerAddress ? `<div class="muted">${escapeHtml(doc.customerAddress)}</div>` : ""}
      <div class="muted" style="margin-top:8px">Date: ${formatDate(doc.date, region)}</div>
      ${doc.dueDate ? `<div class="muted">Due: ${formatDate(doc.dueDate, region)}</div>` : ""}
    </div>
  </div>

  ${
    doc.jobTitle
      ? `<div class="summary"><strong>${escapeHtml(doc.jobTitle)}</strong>${
          doc.summary ? `<div class="muted">${escapeHtml(doc.summary)}</div>` : ""
        }</div>`
      : ""
  }

  <table>
    <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span class="muted">Subtotal</span><span>${formatCurrency(doc.subtotal, region)}</span></div>
    <div class="row"><span class="muted">VAT (${(doc.vatRate * 100).toFixed(0)}%)</span><span>${formatCurrency(doc.vatAmount, region)}</span></div>
    <div class="row grand"><span>Total</span><span>${formatCurrency(doc.total, region)}</span></div>
  </div>

  <div class="foot muted">
    ${doc.variant === "invoice" ? `Payment due by ${doc.dueDate ? formatDate(doc.dueDate, region) : "the due date"}. Thank you for your business.` : "This quote is valid for 30 days."}
  </div>
</body></html>`;
}
