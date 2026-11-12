import React, { useCallback, useEffect, useState } from "react";
import { EmptyState, LoadingState } from "@/admin/components/ui/AdminUi";
import { ActionButton, StatusChip } from "@/shared/ui/Primitives";
import Modal from "@/shared/ui/Modal";
import { billingAPI, billingError } from "@/services/billingAPI";
import { printReceipt } from "@/billing/printReceipt";
import {
  Field,
  ModeChip,
  Panel,
  formatDateKey,
  formatTime,
  inputClass,
  modeLabel,
  money,
  tableCellClass,
  tableHeadClass,
  todayKey,
} from "@/billing/billingShared";

const initialFilters = () => ({
  from: todayKey(),
  to: todayKey(),
  mode: "",
  source: "",
  status: "",
  q: "",
});

const BillingBillsPage = ({ onToast, canManage }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries({ ...filters, page }).filter(
          ([, value]) => value !== "",
        ),
      );
      setResult(await billingAPI.listBills(params));
    } catch (error) {
      onToast(billingError(error, "Could not load bills."), "error");
    } finally {
      setLoading(false);
    }
  }, [filters, page, onToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(load, 250);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const setFilter = (key) => (event) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: event.target.value }));
  };

  const openBill = async (id) => {
    try {
      setCancelReason("");
      setDetail(await billingAPI.getBill(id));
    } catch (error) {
      onToast(billingError(error, "Could not open that bill."), "error");
    }
  };

  const cancelBill = async () => {
    if (!cancelReason.trim()) {
      onToast("Give a reason for cancelling this bill.", "error");
      return;
    }
    setCancelling(true);
    try {
      const { bill } = await billingAPI.cancelBill(
        detail.bill.id,
        cancelReason,
      );
      setDetail((current) => ({ ...current, bill }));
      onToast(`Bill ${bill.billNo} cancelled.`);
      load();
    } catch (error) {
      onToast(billingError(error, "Could not cancel the bill."), "error");
    } finally {
      setCancelling(false);
    }
  };

  const summary = result?.summary;
  const pageCount = result
    ? Math.max(1, Math.ceil(result.total / result.pageSize))
    : 1;
  const bill = detail?.bill;

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="From">
            <input
              type="date"
              value={filters.from}
              max={todayKey()}
              onChange={setFilter("from")}
              className={inputClass}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={filters.to}
              max={todayKey()}
              onChange={setFilter("to")}
              className={inputClass}
            />
          </Field>
          <Field label="Paid by">
            <select
              value={filters.mode}
              onChange={setFilter("mode")}
              className={inputClass}
            >
              <option value="">All</option>
              <option value="cash">Cash</option>
              <option value="phonepe">PhonePe</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
              <option value="split">Split</option>
            </select>
          </Field>
          <Field label="Type">
            <select
              value={filters.source}
              onChange={setFilter("source")}
              className={inputClass}
            >
              <option value="">All</option>
              <option value="manual">Counter bills</option>
              <option value="auto">Auto bills</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              value={filters.status}
              onChange={setFilter("status")}
              className={inputClass}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Field label="Search">
            <input
              type="search"
              value={filters.q}
              onChange={setFilter("q")}
              placeholder="Bill no, item, customer"
              className={inputClass}
            />
          </Field>
        </div>

        {summary && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 rounded-2xl bg-[#f6f1e6] px-4 py-3 text-sm text-[#4a3610]">
            <span>
              <strong>{summary.bills}</strong> active bills
            </span>
            <span>
              Sales <strong>{money(summary.sales)}</strong>
            </span>
            <span>
              Cash <strong>{money(summary.modes.cash)}</strong>
            </span>
            <span>
              PhonePe <strong>{money(summary.modes.phonepe)}</strong>
            </span>
            {summary.modes.card + summary.modes.other > 0 && (
              <span>
                Card/other{" "}
                <strong>
                  {money(summary.modes.card + summary.modes.other)}
                </strong>
              </span>
            )}
          </div>
        )}

        <div className="mt-4">
          {loading && !result ? (
            <LoadingState />
          ) : result?.bills.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className={tableHeadClass}>Bill</th>
                    <th className={tableHeadClass}>Date & time</th>
                    <th className={tableHeadClass}>Items</th>
                    <th className={tableHeadClass}>Paid by</th>
                    <th className={`${tableHeadClass} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.bills.map((entry) => (
                    <tr
                      key={entry.id}
                      onClick={() => openBill(entry.id)}
                      className={`cursor-pointer admin-motion hover:bg-[#faf6ec] ${
                        entry.status === "cancelled" ? "opacity-55" : ""
                      }`}
                    >
                      <td
                        className={`${tableCellClass} whitespace-nowrap font-semibold`}
                      >
                        {entry.billNo}
                        {entry.source === "auto" && (
                          <StatusChip className="ml-2 !px-2 !py-0.5">
                            Auto
                          </StatusChip>
                        )}
                        {entry.status === "cancelled" && (
                          <StatusChip
                            tone="danger"
                            className="ml-2 !px-2 !py-0.5"
                          >
                            Cancelled
                          </StatusChip>
                        )}
                      </td>
                      <td
                        className={`${tableCellClass} whitespace-nowrap text-[#7d6c4d]`}
                      >
                        {formatDateKey(entry.dateKey, {})} ·{" "}
                        {formatTime(entry.billDate)}
                      </td>
                      <td
                        className={`${tableCellClass} max-w-md truncate text-[#7d6c4d]`}
                      >
                        {entry.customerName ? `${entry.customerName} — ` : ""}
                        {entry.itemsLabel}
                      </td>
                      <td className={tableCellClass}>
                        <ModeChip mode={entry.paymentMode} />
                      </td>
                      <td
                        className={`${tableCellClass} text-right font-semibold`}
                      >
                        {money(entry.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No bills match these filters." />
          )}
        </div>

        {result && pageCount > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-[#7d6c4d]">
            <span>
              Page {page} of {pageCount} · {result.total} bills
            </span>
            <div className="flex gap-2">
              <ActionButton
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </ActionButton>
              <ActionButton
                variant="secondary"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                Next
              </ActionButton>
            </div>
          </div>
        )}
      </Panel>

      {bill && (
        <Modal
          title={bill.billNo}
          onClose={() => setDetail(null)}
          maxWidthClassName="max-w-2xl"
          badge={
            <span className="flex gap-2">
              {bill.source === "auto" && (
                <StatusChip>Auto generated</StatusChip>
              )}
              {bill.status === "cancelled" && (
                <StatusChip tone="danger">Cancelled</StatusChip>
              )}
            </span>
          }
        >
          <p className="text-sm text-[#7d6c4d]">
            {formatDateKey(bill.dateKey)} · {formatTime(bill.billDate)}
            {bill.customerName ? ` · ${bill.customerName}` : ""}
            {bill.customerPhone ? ` (${bill.customerPhone})` : ""}
            {bill.createdByName ? ` · billed by ${bill.createdByName}` : ""}
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={tableHeadClass}>Item</th>
                  <th className={`${tableHeadClass} text-right`}>Qty</th>
                  <th className={`${tableHeadClass} text-right`}>Rate</th>
                  <th className={`${tableHeadClass} text-right`}>GST</th>
                  <th className={`${tableHeadClass} text-right`}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((line, index) => (
                  <tr key={`${index}-${line.name}`}>
                    <td className={tableCellClass}>
                      <span className="font-semibold">{line.name}</span>
                      {line.variant && (
                        <span className="text-[#7d6c4d]">
                          {" "}
                          · {line.variant}
                        </span>
                      )}
                    </td>
                    <td className={`${tableCellClass} text-right`}>
                      {line.qty}
                    </td>
                    <td className={`${tableCellClass} text-right`}>
                      {money(line.unitPrice)}
                    </td>
                    <td
                      className={`${tableCellClass} text-right text-[#7d6c4d]`}
                    >
                      {line.gstRate}%
                    </td>
                    <td
                      className={`${tableCellClass} text-right font-semibold`}
                    >
                      {money(line.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-[#7d6c4d]">
              <span>Sub total</span>
              <span>{money(bill.subTotal)}</span>
            </div>
            {bill.discount > 0 && (
              <div className="flex justify-between text-[#7d6c4d]">
                <span>Discount</span>
                <span>− {money(bill.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-[#1f1709]">
              <span>Total</span>
              <span>{money(bill.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#7d6c4d]">
              <span>Taxable {money(bill.taxableTotal)}</span>
              <span>
                CGST {money(bill.cgstTotal)} + SGST {money(bill.sgstTotal)}
              </span>
            </div>
            {bill.payments.map((payment) => (
              <div
                key={`${payment.mode}-${payment.amount}`}
                className="flex justify-between text-[#4a3610]"
              >
                <span>
                  Paid by {modeLabel(payment.mode)}
                  {payment.reference ? ` · ${payment.reference}` : ""}
                </span>
                <span>{money(payment.amount)}</span>
              </div>
            ))}
          </div>

          {bill.status === "cancelled" && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              Cancelled: {bill.cancelReason}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-[#ebe1cb] pt-4">
            <ActionButton
              onClick={() => {
                if (!printReceipt(bill, detail.shop)) {
                  onToast("Allow pop-ups to print the receipt.", "error");
                }
              }}
            >
              Print receipt
            </ActionButton>
            {canManage && bill.status === "active" && (
              <div className="flex flex-1 flex-wrap items-end justify-end gap-2">
                <input
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Reason for cancelling"
                  className={`${inputClass} max-w-[240px]`}
                  maxLength={200}
                />
                <ActionButton
                  variant="danger"
                  disabled={cancelling}
                  onClick={cancelBill}
                >
                  {cancelling ? "Cancelling..." : "Cancel bill"}
                </ActionButton>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BillingBillsPage;
