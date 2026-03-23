import { getOrderDisplayCode } from "@/utils/orderDisplay";
import {
  buildFooterSection,
  buildItemsRows,
  buildPaymentStatusSection,
  buildTotalsSection,
  INVOICE_STYLES,
} from "./invoiceTemplateParts";

const getPaymentMethodLabel = (paymentMethod) => {
  if (!paymentMethod) return "Not specified";
  if (paymentMethod === "upi") return "UPI";
  if (paymentMethod === "cash") return "Cash on delivery";
  return paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
};

export const generateInvoiceHTML = (order) => {
  const address = order?.deliveryAddress || {};
  const items = order?.items || [];

  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deliveryDate = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "To be confirmed";

  const itemsTotal = items.reduce((sum, item) => {
    return sum + (item.price || 0) * (item.quantity || 0);
  }, 0);

  const discount = order.discountAmount || 0;
  const tax = order.taxAmount || 0;
  const deliveryCharge = order.deliveryCharge || 0;
  const totalAmount =
    order.totalAmount || itemsTotal - discount + tax + deliveryCharge;
  const paymentMethodLabel = getPaymentMethodLabel(order.paymentMethod);
  const invoiceCode = getOrderDisplayCode(order);
  const itemsRows = buildItemsRows(items);
  const totalsSection = buildTotalsSection({
    itemsTotal,
    discount,
    tax,
    deliveryCharge,
    totalAmount,
  });
  const paymentStatusSection = buildPaymentStatusSection({
    paymentMethodLabel,
    paymentStatus: order.paymentStatus,
  });
  const footerSection = buildFooterSection();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${invoiceCode}</title>
      <style>
${INVOICE_STYLES}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="business-info">
            <h1>Hindumatha's Cake World</h1>
            <p>Your favorite custom cakes and delicacies</p>
            <p>📞 +91 9490459499</p>
          </div>
          <div class="invoice-meta">
            <div class="label">Invoice</div>
            <div class="value">${invoiceCode}</div>
            <p style="margin-top: 20px;">
              <span class="label">Invoice Date</span><br>
              <span class="value" style="font-size: 14px;">${invoiceDate}</span>
            </p>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <div class="section-title">Bill To</div>
            <div class="customer-info">
              <p><strong>${order.user?.name || "Guest Customer"}</strong></p>
              <p>${order.user?.email || "N/A"}</p>
              <p>${order.user?.phone || "N/A"}</p>
            </div>
          </div>
          
          <div>
            <div class="section-title">Delivery Address</div>
            <div class="delivery-info">
              ${address.label ? `<p><strong>${address.label}</strong></p>` : ""}
              <p>${address.street || ""}</p>
              ${address.landmark ? `<p>${address.landmark}</p>` : ""}
              <p>${[address.city, address.state, address.zipCode].filter(Boolean).join(", ") || "Not provided"}</p>
              <p><strong>Delivery Date:</strong> ${order.deliveryTime ? order.deliveryTime + ", " : ""}${deliveryDate}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

${totalsSection}

${paymentStatusSection}

${footerSection}
      </div>
    </body>
    </html>
  `;
};
