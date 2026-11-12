import { formatDateKey, formatTime, modeLabel } from "@/billing/billingShared";

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ESCAPES[character]);

const amount = (value) => Number(value || 0).toFixed(2);

/* 80mm thermal receipt. Opens the browser print dialog in a new window.
 * Returns false when the browser blocked the popup. */
export const printReceipt = (bill, shop = {}) => {
  const popup = window.open("", "_blank", "width=380,height=640");
  if (!popup) {
    return false;
  }

  const rows = bill.items
    .map((line) => {
      const variant = line.variant ? ` (${escapeHtml(line.variant)})` : "";
      return `
      <tr><td colspan="4">${escapeHtml(line.name)}${variant}</td></tr>
      <tr class="sub">
        <td></td>
        <td class="r">${line.qty}</td>
        <td class="r">${amount(line.unitPrice)}</td>
        <td class="r">${amount(line.lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const payments = (bill.payments || [])
    .map((payment) => {
      const reference = payment.reference
        ? ` - ${escapeHtml(payment.reference)}`
        : "";
      return `<tr><td>${escapeHtml(modeLabel(payment.mode))}${reference}</td><td class="r">${amount(payment.amount)}</td></tr>`;
    })
    .join("");

  const gst = Number(bill.cgstTotal || 0) + Number(bill.sgstTotal || 0);
  const optionalLine = (label, value) =>
    value ? `<p>${label}${escapeHtml(value)}</p>` : "";

  popup.document.write(`<!doctype html><html><head><meta charset="utf-8">
  <title>${escapeHtml(bill.billNo)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body { font-family: "Courier New", monospace; font-size: 12px; color: #000; width: 72mm; margin: 0 auto; }
    h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
    p { margin: 0; text-align: center; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 1px 0; vertical-align: top; text-align: left; }
    .r { text-align: right; }
    .sub td { padding-bottom: 3px; }
    hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
    .total td { font-size: 14px; font-weight: bold; }
    .cancelled { text-align: center; font-weight: bold; border: 1px solid #000; margin: 6px 0; padding: 2px; }
  </style></head><body>
    <h1>${escapeHtml(shop.shopName || "Hindumatha's Cake World")}</h1>
    ${optionalLine("", shop.address)}
    ${optionalLine("Ph: ", shop.phone)}
    ${optionalLine("GSTIN: ", shop.gstin)}
    ${optionalLine("FSSAI: ", shop.fssaiNo)}
    <hr>
    <table>
      <tr><td>Bill: ${escapeHtml(bill.billNo)}</td><td class="r">${escapeHtml(formatDateKey(bill.dateKey))}</td></tr>
      <tr><td>${escapeHtml(bill.customerName || "")}</td><td class="r">${escapeHtml(formatTime(bill.billDate))}</td></tr>
    </table>
    ${bill.status === "cancelled" ? '<div class="cancelled">CANCELLED</div>' : ""}
    <hr>
    <table>
      <tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr>
      ${rows}
    </table>
    <hr>
    <table>
      <tr><td>Sub total</td><td class="r">${amount(bill.subTotal)}</td></tr>
      ${bill.discount > 0 ? `<tr><td>Discount</td><td class="r">-${amount(bill.discount)}</td></tr>` : ""}
      <tr class="total"><td>TOTAL</td><td class="r">${amount(bill.grandTotal)}</td></tr>
    </table>
    <hr>
    <table>${payments}</table>
    <hr>
    <p>Incl. GST ${amount(gst)} (CGST ${amount(bill.cgstTotal)} + SGST ${amount(bill.sgstTotal)})</p>
    <p style="margin-top:6px">${escapeHtml(shop.receiptFooter || "Thank you! Visit again.")}</p>
  </body></html>`);
  popup.document.close();
  popup.focus();
  // A document.write page fires no reliable load event, so print after a beat.
  window.setTimeout(() => {
    if (!popup.closed) popup.print();
  }, 400);
  return true;
};
