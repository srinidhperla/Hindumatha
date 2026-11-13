import React, { useCallback, useEffect, useState } from "react";
import { EmptyState, LoadingState } from "@/admin/components/ui/AdminUi";
import { ActionButton } from "@/shared/ui/Primitives";
import { ChipRow } from "@/shared/workspace/Toolbar";
import { billingAPI, billingError } from "@/services/billingAPI";
import {
  Field,
  Panel,
  Stat,
  downloadCsv,
  formatDateKey,
  inputClass,
  money,
  shiftKey,
  tableCellClass,
  tableHeadClass,
  todayKey,
} from "@/billing/billingShared";

/* Reports — sales for any period, three ways:
 *   by category (open a category to see its items), by item, and by day.
 * Every amount is split into cash and UPI, and the tax table is grouped by
 * HSN code and GST rate. */

// Monday of the week `dateKey` falls in.
const weekStart = (dateKey) => {
  const day = new Date(`${dateKey}T12:00:00+05:30`).getUTCDay();
  return shiftKey(dateKey, -((day + 6) % 7));
};

const quickRanges = () => {
  const today = todayKey();
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonthEnd = shiftKey(monthStart, -1);
  const thisWeek = weekStart(today);
  return [
    { label: "Today", from: today, to: today },
    { label: "Yesterday", from: shiftKey(today, -1), to: shiftKey(today, -1) },
    { label: "This week", from: thisWeek, to: today },
    {
      label: "Last week",
      from: shiftKey(thisWeek, -7),
      to: shiftKey(thisWeek, -1),
    },
    { label: "This month", from: monthStart, to: today },
    {
      label: "Last month",
      from: `${lastMonthEnd.slice(0, 7)}-01`,
      to: lastMonthEnd,
    },
  ];
};

const VIEWS = [
  { value: "categories", label: "By category" },
  { value: "items", label: "By item" },
  { value: "days", label: "By day" },
  { value: "gst", label: "GST" },
];

const numberCell = `${tableCellClass} text-right`;
const numberHead = `${tableHeadClass} text-right`;

const BillingReportsPage = ({ onToast }) => {
  const [range, setRange] = useState(() => {
    const today = todayKey();
    return { from: today, to: today };
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("categories");
  const [openCategory, setOpenCategory] = useState("");

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

  const exportCsv = () => {
    const stamp = `${report.from}-to-${report.to}`;
    if (view === "categories") {
      const rows = [
        [
          "Category",
          "HSN",
          "GST %",
          "Item",
          "Size",
          "Qty",
          "Cash",
          "UPI",
          "Sales",
        ],
      ];
      report.categories.forEach((category) => {
        rows.push([
          category.category,
          category.hsnCode,
          category.gstRate,
          "(all items)",
          "",
          category.qty,
          category.cash,
          category.upi,
          category.amount,
        ]);
        category.items.forEach((item) => {
          rows.push([
            category.category,
            category.hsnCode,
            category.gstRate,
            item.name,
            item.variant,
            item.qty,
            item.cash,
            item.upi,
            item.amount,
          ]);
        });
      });
      downloadCsv(`category-sales-${stamp}.csv`, rows);
    } else if (view === "items") {
      downloadCsv(`item-sales-${stamp}.csv`, [
        ["Item", "Size", "Category", "Qty", "Cash", "UPI", "Sales"],
        ...report.items.map((item) => [
          item.name,
          item.variant,
          item.category,
          item.qty,
          item.cash,
          item.upi,
          item.amount,
        ]),
      ]);
    } else if (view === "days") {
      downloadCsv(`sales-by-day-${stamp}.csv`, [
        ["Date", "Bills", "Cash", "UPI", "Card", "Other", "Discount", "Sales"],
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
    } else {
      downloadCsv(`gst-${stamp}.csv`, [
        ["HSN", "GST %", "Taxable", "CGST", "SGST", "Total"],
        ...report.gst.map((entry) => [
          entry.hsnCode,
          entry.rate,
          entry.taxable,
          entry.cgst,
          entry.sgst,
          entry.total,
        ]),
      ]);
    }
  };

  const totals = report?.totals;
  const ranges = quickRanges();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {ranges.map((entry) => {
            const active = entry.from === range.from && entry.to === range.to;
            return (
              <button
                type="button"
                key={entry.label}
                onClick={() => setRange({ from: entry.from, to: entry.to })}
                className={`h-10 rounded-[0.7rem] px-3.5 text-sm font-semibold admin-motion ${
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
        <div className="ml-auto flex items-end gap-2">
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
        </div>
      </div>

      {loading && !report && <LoadingState />}

      {report && totals && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Total sales"
              value={money(totals.sales)}
              sub={
                report.from === report.to
                  ? formatDateKey(report.from)
                  : `${formatDateKey(report.from, {})} – ${formatDateKey(report.to)}`
              }
              className="!border-[rgba(201,168,76,0.55)] !bg-[#fffaf0]"
            />
            <Stat label="Cash" value={money(totals.modes.cash)} />
            <Stat
              label="UPI (PhonePe)"
              value={money(totals.modes.phonepe)}
              sub={
                totals.modes.card + totals.modes.other > 0
                  ? `Card / other ${money(totals.modes.card + totals.modes.other)}`
                  : undefined
              }
            />
            <Stat
              label="Bills"
              value={totals.bills}
              sub={`Average ${money(totals.averageBill)} · ${totals.itemsSold} items`}
            />
          </div>

          {(totals.discount > 0 || report.cancelled.bills > 0) && (
            <p className="text-sm text-[#7d6c4d]">
              {totals.discount > 0 && (
                <>
                  Discounts given{" "}
                  <strong className="text-[#1f1709]">
                    {money(totals.discount)}
                  </strong>
                </>
              )}
              {totals.discount > 0 && report.cancelled.bills > 0 && " · "}
              {report.cancelled.bills > 0 && (
                <>
                  {report.cancelled.bills} cancelled bills worth{" "}
                  <strong className="text-[#1f1709]">
                    {money(report.cancelled.amount)}
                  </strong>{" "}
                  not counted
                </>
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <ChipRow options={VIEWS} value={view} onChange={setView} />
            <ActionButton variant="secondary" onClick={exportCsv}>
              Download CSV
            </ActionButton>
          </div>

          <Panel>
            {view === "categories" &&
              (report.categories.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className={tableHeadClass}>Category</th>
                        <th className={tableHeadClass}>HSN</th>
                        <th className={numberHead}>GST</th>
                        <th className={numberHead}>Qty</th>
                        <th className={numberHead}>Cash</th>
                        <th className={numberHead}>UPI</th>
                        <th className={numberHead}>Sales</th>
                        <th className={numberHead}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.categories.map((category) => {
                        const open = openCategory === category.category;
                        return (
                          <React.Fragment key={category.category}>
                            <tr
                              onClick={() =>
                                setOpenCategory(open ? "" : category.category)
                              }
                              className="cursor-pointer hover:bg-[#fdfbf5]"
                            >
                              <td className={`${tableCellClass} font-semibold`}>
                                <span className="mr-2 inline-block w-3 text-[#8b6914]">
                                  {open ? "▾" : "▸"}
                                </span>
                                {category.category}
                                <span className="ml-2 text-xs font-normal text-[#8a7a5c]">
                                  {category.items.length} item
                                  {category.items.length === 1 ? "" : "s"}
                                </span>
                              </td>
                              <td className={tableCellClass}>
                                {category.hsnCode || "—"}
                              </td>
                              <td className={numberCell}>
                                {category.gstRate}%
                              </td>
                              <td className={numberCell}>{category.qty}</td>
                              <td className={numberCell}>
                                {money(category.cash)}
                              </td>
                              <td className={numberCell}>
                                {money(category.upi)}
                              </td>
                              <td className={`${numberCell} font-semibold`}>
                                {money(category.amount)}
                              </td>
                              <td className={`${numberCell} text-[#7d6c4d]`}>
                                {totals.sales
                                  ? `${((category.amount / totals.sales) * 100).toFixed(0)}%`
                                  : "—"}
                              </td>
                            </tr>
                            {open &&
                              category.items.map((item) => (
                                <tr
                                  key={`${category.category}-${item.name}-${item.variant}`}
                                  className="bg-[#faf6ec]"
                                >
                                  <td
                                    className={`${tableCellClass} pl-9 text-[#4a3610]`}
                                    colSpan={3}
                                  >
                                    {item.name}
                                    {item.variant && (
                                      <span className="text-[#7d6c4d]">
                                        {" "}
                                        · {item.variant}
                                      </span>
                                    )}
                                  </td>
                                  <td className={numberCell}>{item.qty}</td>
                                  <td className={numberCell}>
                                    {money(item.cash)}
                                  </td>
                                  <td className={numberCell}>
                                    {money(item.upi)}
                                  </td>
                                  <td className={numberCell}>
                                    {money(item.amount)}
                                  </td>
                                  <td className={numberCell} />
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No sales in this period." />
              ))}

            {view === "items" &&
              (report.items.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className={tableHeadClass}>Item</th>
                        <th className={tableHeadClass}>Category</th>
                        <th className={numberHead}>Qty</th>
                        <th className={numberHead}>Cash</th>
                        <th className={numberHead}>UPI</th>
                        <th className={numberHead}>Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.items.map((item) => (
                        <tr
                          key={`${item.category}-${item.name}-${item.variant}`}
                        >
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
                            {item.category}
                          </td>
                          <td className={numberCell}>{item.qty}</td>
                          <td className={numberCell}>{money(item.cash)}</td>
                          <td className={numberCell}>{money(item.upi)}</td>
                          <td className={`${numberCell} font-semibold`}>
                            {money(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No items sold in this period." />
              ))}

            {view === "days" &&
              (report.byDay.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className={tableHeadClass}>Date</th>
                        <th className={numberHead}>Bills</th>
                        <th className={numberHead}>Cash</th>
                        <th className={numberHead}>UPI</th>
                        <th className={numberHead}>Card / other</th>
                        <th className={numberHead}>Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byDay.map((day) => (
                        <tr key={day.dateKey}>
                          <td className={`${tableCellClass} font-semibold`}>
                            {formatDateKey(day.dateKey, { weekday: "short" })}
                          </td>
                          <td className={numberCell}>{day.bills}</td>
                          <td className={numberCell}>{money(day.cash)}</td>
                          <td className={numberCell}>{money(day.phonepe)}</td>
                          <td className={numberCell}>
                            {money(day.card + day.other)}
                          </td>
                          <td className={`${numberCell} font-semibold`}>
                            {money(day.sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No bills in this period." />
              ))}

            {view === "gst" &&
              (report.gst.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className={tableHeadClass}>HSN code</th>
                        <th className={numberHead}>GST %</th>
                        <th className={numberHead}>Taxable value</th>
                        <th className={numberHead}>CGST</th>
                        <th className={numberHead}>SGST</th>
                        <th className={numberHead}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.gst.map((entry) => (
                        <tr key={`${entry.hsnCode}-${entry.rate}`}>
                          <td className={`${tableCellClass} font-semibold`}>
                            {entry.hsnCode || "—"}
                          </td>
                          <td className={numberCell}>{entry.rate}%</td>
                          <td className={numberCell}>{money(entry.taxable)}</td>
                          <td className={numberCell}>{money(entry.cgst)}</td>
                          <td className={numberCell}>{money(entry.sgst)}</td>
                          <td className={`${numberCell} font-semibold`}>
                            {money(entry.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totals.autoBills > 0 && (
                    <p className="mt-3 text-xs text-[#8a7a5c]">
                      Includes {totals.autoBills} auto-generated bills, whose
                      items (and so the split between HSN codes and rates) are
                      generated, not what was rung up at the counter.
                    </p>
                  )}
                </div>
              ) : (
                <EmptyState message="No tax to report in this period." />
              ))}
          </Panel>
        </>
      )}
    </div>
  );
};

export default BillingReportsPage;
