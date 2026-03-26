import { getOrderDisplayCode } from "@/utils/orderDisplay";
import { generateInvoiceHTML } from "@/services/invoiceTemplate";

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
    throw error;
  }
};

export default {
  downloadInvoicePDF,
  downloadInvoiceHTML,
};
