import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiRefreshCw } from "react-icons/fi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState, LoadingState } from "@/admin/components/ui/AdminUi";
import { StatusChip } from "@/shared/ui/Primitives";
import { billingAPI, billingError } from "@/services/billingAPI";
import {
  ModeChip,
  Panel,
  Stat,
  formatDateKey,
  formatTime,
  inputClass,
  money,
  shiftKey,
  tableCellClass,
  tableHeadClass,
  titleCase,
  todayKey,
} from "@/billing/billingShared";

const CASH_COLOR = "#2a1f0e";
const PHONEPE_COLOR = "#c9a84c";
const OTHER_COLOR = "#b9ab8b";

const hourLabel = (hour) => `${hour % 12 || 12} ${hour >= 12 ? "pm" : "am"}`;

const compactRupees = (value) =>
  value >= 1000
    ? `₹${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k`
    : `₹${value}`;

const dayChipClass = (active) =>
  `h-10 rounded-[0.7rem] px-3.5 text-sm font-semibold admin-motion ${
    active
      ? "bg-[#1f1709] text-[#f3dd96]"
      : "border border-[#e3d7bb] bg-white text-[#5c4a26] hover:bg-[#faf6ec]"
  }`;

const Delta = ({ today, yesterday }) => {
  if (!yesterday) {
    return null;
  }
  const change = ((today - yesterday) / yesterday) * 100;
  const up = change >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        up
          ? "bg-emerald-400/15 text-emerald-300"
          : "bg-rose-400/15 text-rose-300"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(change).toFixed(0)}% vs day before
    </span>
  );
};

const BillingDashboardPage = ({ onToast }) => {
  const [date, setDate] = useState(todayKey());
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await billingAPI.getDashboard(date));
    } catch (error) {
      onToast(billingError(error, "Could not load the dashboard."), "error");
    } finally {
      setLoading(false);
    }
  }, [date, onToast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !dashboard) {
    return <LoadingState />;
  }

  if (!dashboard) {
    return <EmptyState message="The billing dashboard could not be loaded." />;
  }

  const { today, yesterday, monthToDate, trend, hourly, topItems, categories } =
    dashboard;
  const todayDate = todayKey();
  const yesterdayDate = shiftKey(todayDate, -1);
  const trendData = trend.map((day) => ({
    ...day,
    label: formatDateKey(day.dateKey, {}),
  }));
  const categoryTotal = categories.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const peakHour = Math.max(1, ...hourly.map((slot) => slot.sales));
  const otherPaid = today.modes.card + today.modes.other;
  const split = [
    { label: "Cash", amount: today.modes.cash, color: "#f6efdc" },
    { label: "PhonePe", amount: today.modes.phonepe, color: PHONEPE_COLOR },
    { label: "Card / other", amount: otherPaid, color: OTHER_COLOR },
  ].filter((part) => part.amount > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={dayChipClass(date === todayDate)}
          onClick={() => setDate(todayDate)}
        >
          Today
        </button>
        <button
          type="button"
          className={dayChipClass(date === yesterdayDate)}
          onClick={() => setDate(yesterdayDate)}
        >
          Yesterday
        </button>
        <input
          type="date"
          value={date}
          max={todayDate}
          onChange={(event) => setDate(event.target.value || todayDate)}
          className={`${inputClass} w-auto`}
          aria-label="Dashboard date"
        />
        <button
          type="button"
          onClick={load}
          disabled={loading}
          aria-label="Refresh"
          title="Refresh"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-[0.7rem] border border-[#e3d7bb] bg-white text-[#5c4a26] admin-motion hover:bg-[#faf6ec] disabled:opacity-50"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="ws-card-dark flex flex-col justify-between p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e8d08a]">
                Sales · {date === todayDate ? "Today" : formatDateKey(date)}
              </p>
              <p className="font-playfair mt-2 text-[44px] font-bold leading-none text-white">
                {money(today.sales)}
              </p>
            </div>
            <Delta today={today.sales} yesterday={yesterday.sales} />
          </div>

          <div className="mt-6">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/10">
              {split.map((part) => (
                <span
                  key={part.label}
                  style={{
                    width: `${(part.amount / today.sales) * 100}%`,
                    background: part.color,
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {(split.length
                ? split
                : [{ label: "No payments yet", amount: 0 }]
              ).map((part) => (
                <div key={part.label} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: part.color || "#6b5a3a" }}
                  />
                  <span className="text-sm text-[#cdbb8c]">{part.label}</span>
                  <span className="text-sm font-semibold text-white">
                    {money(part.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Bills"
            value={today.bills}
            sub={`${today.manualBills} counter · ${today.autoBills} auto${today.cancelled ? ` · ${today.cancelled} cancelled` : ""}`}
          />
          <Stat
            label="Average bill"
            value={money(today.averageBill)}
            sub={`${today.itemsSold} items sold`}
          />
          <Stat
            label="This month"
            value={money(monthToDate.sales)}
            sub={`${monthToDate.bills} bills`}
          />
          <Stat
            label="Discounts"
            value={money(today.discount)}
            sub={
              today.discount
                ? `${((today.discount / (today.sales + today.discount)) * 100).toFixed(1)}% of gross`
                : "None given"
            }
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel
          title="Last 7 days"
          className="lg:col-span-2"
          action={
            <div className="flex gap-4 text-xs text-[#7d6c4d]">
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: CASH_COLOR }}
                />
                Cash
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: PHONEPE_COLOR }}
                />
                PhonePe
              </span>
            </div>
          }
        >
          {trend.some((day) => day.sales > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  barSize={30}
                  margin={{ top: 6, right: 4, left: -8, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#f0e8d6" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#7d6c4d" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={compactRupees}
                    tick={{ fontSize: 12, fill: "#7d6c4d" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(201,168,76,0.1)" }}
                    formatter={(value) => money(value)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #ebe1cb",
                      boxShadow: "0 8px 20px rgba(31,23,9,0.1)",
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="cash"
                    name="Cash"
                    stackId="sales"
                    fill={CASH_COLOR}
                  />
                  <Bar
                    dataKey="phonepe"
                    name="PhonePe"
                    stackId="sales"
                    fill={PHONEPE_COLOR}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No bills in the last 7 days." />
          )}
        </Panel>

        <Panel title="Busy hours">
          {hourly.length ? (
            <ul className="space-y-2">
              {hourly.map((slot) => (
                <li key={slot.hour} className="flex items-center gap-3 text-sm">
                  <span className="w-11 shrink-0 text-xs text-[#7d6c4d]">
                    {hourLabel(slot.hour)}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f3ecdb]">
                    <span
                      className="block h-full rounded-full bg-[#c9a84c]"
                      style={{ width: `${(slot.sales / peakHour) * 100}%` }}
                    />
                  </span>
                  <span className="w-16 shrink-0 text-right font-semibold">
                    {money(slot.sales)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No bills yet for this day." />
          )}
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Top selling items" className="lg:col-span-2">
          {topItems.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className={tableHeadClass}>Item</th>
                    <th className={tableHeadClass}>Category</th>
                    <th className={`${tableHeadClass} text-right`}>Qty</th>
                    <th className={`${tableHeadClass} text-right`}>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((item) => (
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
            <EmptyState message="Nothing sold yet for this day." />
          )}
        </Panel>

        <Panel title="By category">
          {categories.length ? (
            <ul className="space-y-3">
              {categories.map((entry) => (
                <li key={entry.category}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {titleCase(entry.category)}
                    </span>
                    <span className="font-semibold">{money(entry.amount)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f3ecdb]">
                    <div
                      className="h-full rounded-full bg-[#2a1f0e]"
                      style={{
                        width: `${(entry.amount / categoryTotal) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No category sales yet." />
          )}
        </Panel>
      </div>

      <Panel
        title="Recent bills"
        action={
          <Link
            to="/billing/bills"
            className="text-sm font-semibold text-[#8b6914] hover:underline"
          >
            View all
          </Link>
        }
      >
        {dashboard.recentBills.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={tableHeadClass}>Bill</th>
                  <th className={tableHeadClass}>Time</th>
                  <th className={tableHeadClass}>Items</th>
                  <th className={tableHeadClass}>Paid by</th>
                  <th className={`${tableHeadClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentBills.map((bill) => (
                  <tr
                    key={bill.id}
                    className={bill.status === "cancelled" ? "opacity-55" : ""}
                  >
                    <td
                      className={`${tableCellClass} whitespace-nowrap font-semibold`}
                    >
                      {bill.billNo}
                      {bill.source === "auto" && (
                        <StatusChip className="ml-2 !px-2 !py-0.5">
                          Auto
                        </StatusChip>
                      )}
                      {bill.status === "cancelled" && (
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
                      {formatTime(bill.billDate)}
                    </td>
                    <td
                      className={`${tableCellClass} max-w-md truncate text-[#7d6c4d]`}
                    >
                      {bill.itemsLabel}
                    </td>
                    <td className={tableCellClass}>
                      <ModeChip mode={bill.paymentMode} />
                    </td>
                    <td
                      className={`${tableCellClass} text-right font-semibold`}
                    >
                      {money(bill.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No bills yet for this day. Start with New Bill." />
        )}
      </Panel>
    </div>
  );
};

export default BillingDashboardPage;
