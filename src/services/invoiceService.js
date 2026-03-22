import { getOrderDisplayCode } from "../utils/orderDisplay";

const generateInvoiceHTML = (order) => {
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${getOrderDisplayCode(order)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 3px solid #d4a574;
          padding-bottom: 20px;
        }
        
        .business-info h1 {
          font-size: 28px;
          color: #2c1810;
          margin-bottom: 5px;
        }
        
        .business-info p {
          color: #666;
          font-size: 13px;
          line-height: 1.6;
        }
        
        .invoice-meta {
          text-align: right;
        }
        
        .invoice-meta .label {
          font-size: 11px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .invoice-meta .value {
          font-size: 18px;
          font-weight: bold;
          color: #2c1810;
        }
        
        .invoice-meta p {
          margin: 10px 0;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 13px;
          font-weight: bold;
          text-transform: uppercase;
          color: #2c1810;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e0d5c7;
        }
        
        .customer-info, .delivery-info {
          font-size: 13px;
          line-height: 1.8;
          color: #333;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .items-table thead {
          background: #f5f1ebFF;
          border-bottom: 2px solid #d4a574;
        }
        
        .items-table th {
          text-align: left;
          padding: 12px;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          color: #2c1810;
          letter-spacing: 0.3px;
        }
        
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e0d5c7;
          font-size: 13px;
        }
        
        .items-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .item-name {
          font-weight: 500;
          color: #2c1810;
        }
        
        .item-details {
          font-size: 12px;
          color: #666;
          margin-top: 3px;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        
        .totals-box {
          width: 300px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 13px;
          border-bottom: 1px solid #e0d5c7;
        }
        
        .total-row.final {
          border-bottom: 2px solid #d4a574;
          border-top: 2px solid #d4a574;
          font-weight: bold;
          font-size: 16px;
          color: #2c1810;
          padding: 15px 0;
        }
        
        .total-label {
          color: #666;
        }
        
        .total-value {
          color: #2c1810;
          font-weight: 500;
        }
        
        .payment-status {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          padding: 15px;
          background: #f5f1eb;
          border-radius: 6px;
        }
        
        .payment-status p {
          font-size: 12px;
        }
        
        .payment-status .label {
          color: #999;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .payment-status .value {
          color: #2c1810;
          font-weight: 500;
          font-size: 13px;
        }
        
        .footer {
          text-align: center;
          padding-top: 30px;
          border-top: 1px solid #e0d5c7;
          font-size: 12px;
          color: #999;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .container {
            padding: 0;
            box-shadow: none;
          }
          
          .no-print {
            display: none;
          }
        }
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
            <div class="value">${getOrderDisplayCode(order)}</div>
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
              ${items
                .map((item, index) => {
                  const itemTotal = (item.price || 0) * (item.quantity || 0);
                  const details = [item.size, item.flavor]
                    .filter(Boolean)
                    .join(" • ");
                  return `
                    <tr>
                      <td>
                        <div class="item-name">${item.product?.name || "Custom Cake"}</div>
                        ${details ? `<div class="item-details">${details}</div>` : ""}
                      </td>
                      <td class="text-center">${item.quantity || 0}</td>
                      <td class="text-right">₹${(item.price || 0).toLocaleString("en-IN")}</td>
                      <td class="text-right">₹${itemTotal.toLocaleString("en-IN")}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div class="totals-box">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">₹${itemsTotal.toLocaleString("en-IN")}</span>
            </div>
            ${
              discount > 0
                ? `
              <div class="total-row">
                <span class="total-label">Discount</span>
                <span class="total-value" style="color: green;">-₹${discount.toLocaleString("en-IN")}</span>
              </div>
            `
                : ""
            }
            ${
              tax > 0
                ? `
              <div class="total-row">
                <span class="total-label">Tax</span>
                <span class="total-value">₹${tax.toLocaleString("en-IN")}</span>
              </div>
            `
                : ""
            }
            ${
              deliveryCharge > 0
                ? `
              <div class="total-row">
                <span class="total-label">Delivery Charge</span>
                <span class="total-value">₹${deliveryCharge.toLocaleString("en-IN")}</span>
              </div>
            `
                : ""
            }
            <div class="total-row final">
              <span>Total Amount</span>
              <span>₹${totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div class="payment-status">
          <div>
            <p class="label">Payment Method</p>
            <p class="value">${getPaymentMethodLabel(order.paymentMethod)}</p>
          </div>
          <div>
            <p class="label">Payment Status</p>
            <p class="value">${order.paymentStatus ? order.paymentStatus.toUpperCase() : "PENDING"}</p>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your order! Invoice generated on ${new Date().toLocaleDateString("en-IN")} at ${new Date().toLocaleTimeString("en-IN")}</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getPaymentMethodLabel = (paymentMethod) => {
  if (!paymentMethod) return "Not specified";
  if (paymentMethod === "upi") return "UPI";
  if (paymentMethod === "cash") return "Cash on delivery";
  return paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
};

export const downloadInvoicePDF = (order) => {
  try {
    const htmlContent = generateInvoiceHTML(order);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Create a temporary iframe to print to PDF
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;

    iframe.onload = () => {
      iframe.contentWindow.print();
      // Cleanup after a short delay to allow print dialog to open
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };

    document.body.appendChild(iframe);
  } catch (error) {
    console.error("Error downloading invoice:", error);
    throw error;
  }
};

export const downloadInvoiceHTML = (order) => {
  try {
    const htmlContent = generateInvoiceHTML(order);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${getOrderDisplayCode(order)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading invoice HTML:", error);
    throw error;
  }
};

export default {
  downloadInvoicePDF,
  downloadInvoiceHTML,
};
