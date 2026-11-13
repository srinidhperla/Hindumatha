import React from "react";
import { SurfaceCard, StatusChip } from "@/shared/ui/Primitives";

export const BILLING_ROLES = ["admin", "owner", "manager", "cashier"];
export const BILLING_MANAGER_ROLES = ["admin", "owner", "manager"];

export const PAYMENT_MODES = [
  { id: "cash", label: "Cash" },
  { id: "phonepe", label: "PhonePe" },
  { id: "card", label: "Card" },
  { id: "other", label: "Other" },
];

const MODE_LABELS = {
  cash: "Cash",
  phonepe: "PhonePe",
  card: "Card",
  other: "Other",
  split: "Split",
};
const MODE_TONES = {
  cash: "success",
  phonepe: "info",
  card: "accent",
  other: "neutral",
  split: "warning",
};

export const modeLabel = (mode) => MODE_LABELS[mode] || mode;

export const ModeChip = ({ mode }) => (
  <StatusChip tone={MODE_TONES[mode] || "neutral"}>
    {modeLabel(mode)}
  </StatusChip>
);

export const inputClass = "ws-input";

export const labelClass =
  "mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7d6c4d]";

export const money = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export const todayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const shiftKey = (dateKey, days) => {
  const date = new Date(`${dateKey}T12:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    date,
  );
};

// Monday of the week `dateKey` falls in.
export const weekStart = (dateKey) => {
  const day = new Date(`${dateKey}T12:00:00+05:30`).getUTCDay();
  return shiftKey(dateKey, -((day + 6) % 7));
};

// Today / Yesterday / This week / Last week / This month / Last month.
export const quickRanges = () => {
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

export const formatDateKey = (dateKey, options) =>
  dateKey
    ? new Date(`${dateKey}T12:00:00+05:30`).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        ...(options || { year: "numeric" }),
      })
    : "";

export const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export const formatClock = (time) => {
  const [hours, minutes] = String(time || "")
    .split(":")
    .map(Number);
  if (!Number.isFinite(hours)) return "";
  const suffix = hours >= 12 ? "pm" : "am";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

export const titleCase = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();

export const Panel = ({
  title,
  subtitle,
  action,
  className = "",
  children,
}) => (
  <SurfaceCard className={`p-4 md:p-5 ${className}`}>
    {(title || action) && (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && (
            <h2 className="font-playfair text-lg font-bold text-[#1f1709]">
              {title}
            </h2>
          )}
          {subtitle && <p className="text-sm text-[#7d6c4d]">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </SurfaceCard>
);

export const Stat = ({ label, value, sub, className = "" }) => (
  <div className={`ws-card px-4 py-3.5 ${className}`}>
    <p className="ws-eyebrow">{label}</p>
    <p className="mt-1 text-[26px] font-bold leading-tight text-[#1f1709]">
      {value}
    </p>
    {sub ? (
      <p className="mt-0.5 truncate text-xs text-[#7d6c4d]">{sub}</p>
    ) : null}
  </div>
);

export const Field = ({ label, hint, className = "", children }) => (
  <label className={`block ${className}`}>
    <span className={labelClass}>{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-[#8a7a5c]">{hint}</span>}
  </label>
);

export const tableHeadClass =
  "whitespace-nowrap bg-[#faf6ec] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7d6c4d] first:rounded-l-lg last:rounded-r-lg";
export const tableCellClass =
  "border-b border-[#f3ecdb] px-3 py-2.5 text-sm text-[#1f1709]";

export const downloadCsv = (filename, rows) => {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(
    new Blob([`${String.fromCharCode(0xfeff)}${csv}`], { type: "text/csv" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
