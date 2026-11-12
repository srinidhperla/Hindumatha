import React, { useCallback, useEffect, useState } from "react";
import {
  EmptyState,
  LoadingState,
  MetricCard,
} from "@/admin/components/ui/AdminUi";
import { ActionButton } from "@/shared/ui/Primitives";
import { billingAPI, billingError } from "@/services/billingAPI";
import {
  Field,
  Panel,
  downloadCsv,
  formatDateKey,
  inputClass,
  money,
  shiftKey,
  tableCellClass,
  tableHeadClass,
  titleCase,
  todayKey,
} from "@/billing/billingShared";

const quickRanges = () => {
  const today = todayKey();
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonthEnd = shiftKey(monthStart, -1);
  return [
    { label: "Today", from: today, to: today },
    { label: "Yesterday", from: shiftKey(today, -1), to: shiftKey(today, -1) },
    { label: "Last 7 days", from: shiftKey(today, -6), to: today },
    { label: "This month", from: monthStart, to: today },
    {
      label: "Last month",
      from: `${lastMonthEnd.slice(0, 7)}-01`,
      to: lastMonthEnd,
    },
  ];
};

const BillingReportsPage = ({ onToast }) => {
  const [range, setRange] = useState(() => {
    const today = todayKey();
    return { from: `${today.slice(0, 7)}-01`, to: today };
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!range.from || !range.to) return;
    setLoading(true);
    try {
      setReport(await billingAPI.getReport(range));
    } catch (error) {
      onToast(billingError(error, "Could not load the report."), "error");
    } finally {
      setLoading(false);
    }
  }, [range, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const exportDays = () =>
    downloadCsv(`sales-by-day-${report.from}-to-${report.to}.csv`, [
      [
        "Date",
        "Bills",
        "Cash",
        "PhonePe",
        "Card",
        "Other",
        "Discount",
        "Sales",
      ],
      ...report.byDay.map((day) => [
        day.dateKey,
        day.bills,
        day.cash,
        day.phonepe,
        day.card,
        day.other,
        day.discount,
        day.sales,
      ]),
    ]);

  const exportItems = () =>
    downloadCsv(`item-sales-${report.from}-to-${report.to}.csv`, [
      ["Item", "Size", "Category", "Qty", "Sales"],
      ...report.items.map((item) => [
        item.name,
        item.variant,
        item.category,
        item.qty,
        item.amount,
      ]),
    ]);

  const totals = report?.totals;

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="From">
            <input
              type="date"
              value={range.from}
              max={range.to || todayKey()}
              onChange={(event) =>
                setRange({ ...range, from: event.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={range.to}
              max={todayKey()}
              onChange={(event) =>
                setRange({ ...range, to: event.target.value })
              }
              className={inputClass}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {quickRanges().map((entry) => {
              const active = entry.from === range.from && entry.to === range.to;
              return (
                <button
                  type="button"
                  key={entry.label}
                  onClick={() => setRange({ from: entry.from, to: entry.to })}
                  className={`rounded-full px-3 py-2 text-xs font-semibold admin-motion ${
                    active
                      ? "bg-[#1f1709] text-[#f3dd96]"
                      : "border border-[#e3d7bb] bg-white text-[#5c4a26] hover:bg-[#faf6ec]"
                  }`}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {loading && !report && <LoadingState />}

      {report && totals && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              highlight
              title="Total sales"
              value={money(totals.sales)}
              subtitle={`${formatDateKey(report.from, {})} – ${formatDateKey(report.to)}`}
            />
            <MetricCard
              title="Bills"
              value={totals.bills}
              subtitle={`Average ${money(totals.averageBill)} · ${totals.itemsSold} items`}
            />
            <MetricCard
              title="Cash / PhonePe"
              value={`${money(totals.modes.cash)} / ${money(totals.modes.phonepe)}`}
              subtitle={`Card ${money(totals.modes.card)} · Other ${money(totals.modes.other)}`}
            />
            <MetricCard
              title="Counter vs auto bills"
              value={`${totals.manualBills} / ${totals.autoBills}`}
              subtitle={`${money(totals.manualSales)} counter · ${money(totals.autoSales)} auto`}
            />
          </div>

          {(totals.discount > 0 || report.cancelled.bills > 0) && (
            <p className="rounded-2xl bg-[#f6f1e6] px-4 py-3 text-sm text-[#4a3610]">
              Discounts given: <strong>{money(totals.discount)}</strong>
              {report.cancelled.bills > 0 && (
                <>
                  {" "}
                  · Cancelled bills (not counted):{" "}
                  <strong>
                    {report.cancelled.bills} worth{" "}
                    {money(report.cancelled.amount)}
                  </strong>
                </>
              )}
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              title="Day-wise sales"
              className="lg:col-span-2"
              action={
                report.byDay.length > 0 && (
                  <ActionButton variant="secondary" onClick={exportDays}>
                    Download CSV
                  </ActionButton>
                )
              }
            >
              {report.byDay.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className={tableHeadClass}>Date</th>
                        <th className={`${tableHeadClass} text-right`}>
                          Bills
                        </th>
                        <th className={`${tableHeadClass} text-right`}>Cash</th>
                        <th className={`${tableHeadClass} text-right`}>
                          PhonePe
                        </th>
                        <th className={`${tableHeadClass} text-right`}>
                          Card/other
                        </th>
                        <th className={`${tableHeadClass} text-right`}>
                          Sales
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byDay.map((day) => (
                        <tr key={day.dateKey}>
                          <td className={`${tableCellClass} font-semibold`}>
                            {formatDateKey(day.dateKey, { weekday: "short" })}
                          </td>
                          <td className={`${tableCellClass} text-right`}>
                            {day.bills}
                          </td>
                          <td className={`${tableCellClass} text-right`}>
                            {money(day.cash)}
                          </td>
                          <td className={`${tableCellClass} text-right`}>
                            {money(day.phonepe)}
                          </td>
                          <td className={`${tableCellClass} text-right`}>
                            {money(day.card + day.other)}
                          </td>
                          <td
                            className={`${tableCellClass} text-right font-semibold`}
                          >
                            {money(day.sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No bills in this period." />
              )}
            </Panel>

            <div className="space-y-4">
              <Panel title="GST summary" subtitle="Prices include GST.">
                {report.gst.length ? (
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className={tableHeadClass}>Rate</th>
                        <th className={`${tableHeadClass} text-right`}>
                          Taxable
                        </th>
                        <th className={`${tableHeadClass} text-right`}>CGST</th>
                        <th className={`${tableHeadClass} text-right`}>SGST</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.gst.map((entry) => (
                        <tr key={entry.rate}>
                          <td className={`${tableCellClass} font-semibold`}>
                            {entry.rate}%
                          </td>
                          <td className={`${tableCellClass} text-right`}>
                            {money(entry.taxable)}
                          </td>
                          <td className={`${tableCellClass} text-right`}>
                            {money(entry.cgst)}
                          </td>
                          <td className={`${tableCellClass} text-right`}>
                            {money(entry.sgst)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-[#7d6c4d]">No tax to report.</p>
                )}
                {totals.autoBills > 0 && (
                  <p className="mt-3 text-xs text-[#8a7a5c]">
                    Includes {totals.autoBills} auto-generated bills, whose item
                    mix (and so the split by GST rate) is an estimate.
                  </p>
                )}
              </Panel>

              <Panel title="By category">
                {report.categories.length ? (
                  <ul className="space-y-2 text-sm">
                    {report.categories.map((entry) => (
                      <li key={entry.category} className="flex justify-between">
                        <span className="text-[#1f1709]">
                          {titleCase(entry.category)}{" "}
                          <span className="text-[#8a7a5c]">× {entry.qty}</span>
                        </span>
                        <span className="font-semibold">
                          {money(entry.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#7d6c4d]">
                    No sales in this period.
                  </p>
                )}
              </Panel>
            </div>
          </div>

          <Panel
            title="Item-wise sales"
            action={
              report.items.length > 0 && (
                <ActionButton variant="secondary" onClick={exportItems}>
                  Download CSV
                </ActionButton>
              )
            }
          >
            {report.items.length ? (
              <div className="max-h-[480px] overflow-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className={tableHeadClass}>Item</th>
                      <th className={tableHeadClass}>Category</th>
                      <th className={`${tableHeadClass} text-right`}>
                        Qty sold
                      </th>
                      <th className={`${tableHeadClass} text-right`}>Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.items.map((item) => (
                      <tr key={`${item.name}-${item.variant}`}>
                        <td className={tableCellClass}>
                          <span className="font-semibold">{item.name}</span>
                          {item.variant && (
                            <span className="text-[#7d6c4d]">
                              {" "}
                              · {item.variant}
                            </span>
                          )}
                        </td>
                        <td className={`${tableCellClass} text-[#7d6c4d]`}>
                          {titleCase(item.category)}
                        </td>
                        <td className={`${tableCellClass} text-right`}>
                          {item.qty}
                        </td>
                        <td
                          className={`${tableCellClass} text-right font-semibold`}
                        >
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No items sold in this period." />
            )}
          </Panel>
        </>
      )}
    </div>
  );
};

export default BillingReportsPage;
