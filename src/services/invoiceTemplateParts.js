const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export const INVOICE_STYLES = `
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
`;

export const buildItemsRows = (items) =>
  items
    .map((item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      const details = [item.size, item.flavor].filter(Boolean).join(" • ");
      return `
                    <tr>
                      <td>
                        <div class="item-name">${item.product?.name || "Custom Cake"}</div>
                        ${details ? `<div class="item-details">${details}</div>` : ""}
                      </td>
                      <td class="text-center">${item.quantity || 0}</td>
                      <td class="text-right">${formatCurrency(item.price || 0)}</td>
                      <td class="text-right">${formatCurrency(itemTotal)}</td>
                    </tr>
                  `;
    })
    .join("");

export const buildTotalsSection = ({
  itemsTotal,
  discount,
  tax,
  deliveryCharge,
  totalAmount,
}) => `
        <div class="totals">
          <div class="totals-box">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">${formatCurrency(itemsTotal)}</span>
            </div>
            ${
              discount > 0
                ? `
              <div class="total-row">
                <span class="total-label">Discount</span>
                <span class="total-value" style="color: green;">-${formatCurrency(discount)}</span>
              </div>
            `
                : ""
            }
            ${
              tax > 0
                ? `
              <div class="total-row">
                <span class="total-label">Tax</span>
                <span class="total-value">${formatCurrency(tax)}</span>
              </div>
            `
                : ""
            }
            ${
              deliveryCharge > 0
                ? `
              <div class="total-row">
                <span class="total-label">Delivery Charge</span>
                <span class="total-value">${formatCurrency(deliveryCharge)}</span>
              </div>
            `
                : ""
            }
            <div class="total-row final">
              <span>Total Amount</span>
              <span>${formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
`;

export const buildPaymentStatusSection = ({
  paymentMethodLabel,
  paymentStatus,
}) => `
        <div class="payment-status">
          <div>
            <p class="label">Payment Method</p>
            <p class="value">${paymentMethodLabel}</p>
          </div>
          <div>
            <p class="label">Payment Status</p>
            <p class="value">${paymentStatus ? paymentStatus.toUpperCase() : "PENDING"}</p>
          </div>
        </div>
`;

export const buildFooterSection = () => `
        <div class="footer">
          <p>Thank you for your order! Invoice generated on ${new Date().toLocaleDateString("en-IN")} at ${new Date().toLocaleTimeString("en-IN")}</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
`;
