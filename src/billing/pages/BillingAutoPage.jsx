import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EmptyState } from "@/admin/components/ui/AdminUi";
import { ActionButton, StatusChip } from "@/shared/ui/Primitives";
import { ChipRow } from "@/shared/workspace/Toolbar";
import { billingAPI, billingError } from "@/services/billingAPI";
import AutoBillEditor from "@/billing/components/AutoBillEditor";
import {
  buildTransactions,
  detectColumns,
  readSheet,
} from "@/billing/phonepeImport";
import {
  Field,
  ModeChip,
  Panel,
  Stat,
  formatClock,
  formatDateKey,
  inputClass,
  money,
  tableCellClass,
  tableHeadClass,
  todayKey,
} from "@/billing/billingShared";

/* Auto Billing — builds a day's bills from what was actually collected:
 *   - each PhonePe transaction becomes one bill for exactly its amount
 *   - the cash is split over the remaining bills
 *   - any category given an amount comes to that amount across the day
 * Nothing is saved until the generated bills are reviewed. */

const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;
const isAmount = (token) => /^\d+(\.\d{1,2})?$/.test(token);

/* Typed or pasted transactions: amounts separated by spaces/commas/new lines,
 * or one per line with an optional time and reference ("250 14:30 T2411…"). */
const parsePasted = (text) => {
  const entries = [];
  String(text || "")
    .split(/\r?\n/)
    .forEach((rawLine) => {
      const tokens = rawLine
        .replace(/₹|rs\.?/gi, " ")
        .split(/[\s,;]+/)
        .filter(Boolean);
      if (!tokens.length) return;

      if (tokens.every(isAmount)) {
        tokens.forEach((token) => entries.push({ amount: Number(token) }));
        return;
      }
      const amountToken = tokens.find(isAmount);
      if (!amountToken) return;
      const rest = tokens.filter((token) => token !== amountToken);
      const timeToken = rest.find((token) => TIME_PATTERN.test(token));
      entries.push({
        amount: Number(amountToken),
        time: timeToken ? timeToken.padStart(5, "0") : "",
        reference: rest.filter((token) => token !== timeToken).join(" "),
      });
    });
  return entries;
};

const COLUMN_LABELS = [
  ["amount", "Amount"],
  ["reference", "PhonePe transaction ID"],
  ["date", "Date"],
  ["time", "Time"],
  ["status", "Status"],
  ["type", "Payment type"],
];

const REVIEW_FILTERS = [
  { value: "all", label: "All" },
  { value: "fix", label: "Needs fixing" },
  { value: "phonepe", label: "PhonePe" },
  { value: "cash", label: "Cash" },
  { value: "edited", label: "Edited" },
];

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const toCommitLine = (line) => {
  if (line.productId) {
    return {
      productId: line.productId,
      variantKey: line.variantKey,
      qty: line.qty,
    };
  }
  if (line.open) {
    return {
      categoryId: line.categoryId,
      name: line.name,
      unitPrice: line.unitPrice,
      qty: line.qty,
      open: true,
    };
  }
  return {
    categoryId: line.categoryId,
    unitPrice: line.unitPrice,
    qty: line.qty,
  };
};

const segmentClass = (active) =>
  `rounded-lg px-3 py-2 text-xs font-semibold admin-motion ${
    active ? "bg-[#1f1709] text-[#f3dd96]" : "text-[#5c4a26] hover:bg-white"
  }`;

const BillingAutoPage = ({ onToast }) => {
  const fileInputRef = useRef(null);
  const [date, setDate] = useState(todayKey());
  const [totalBills, setTotalBills] = useState("");
  const [amountMode, setAmountMode] = useState("cash");
  const [amount, setAmount] = useState("");

  // PhonePe: an imported file, or pasted amounts.
  const [sheet, setSheet] = useState(null); // { name, rows }
  const [columns, setColumns] = useState(null);
  const [onlySuccessful, setOnlySuccessful] = useState(true);
  const [pasted, setPasted] = useState("");

  const [categories, setCategories] = useState([]);
  // Every billing category and item, for the bill editor.
  const [catalog, setCatalog] = useState({ items: [], billingCategories: [] });
  // Category whose open line covers amounts your prices cannot make.
  const [gapCategoryId, setGapCategoryId] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [targets, setTargets] = useState({});
  const [showTimes, setShowTimes] = useState(false);
  const [options, setOptions] = useState({
    startTime: "09:00",
    endTime: "22:00",
    maxQtyPerItem: 4,
  });

  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState("");
  const [batches, setBatches] = useState([]);

  const loadBatches = useCallback(() => {
    billingAPI
      .listAutoBatches()
      .then((response) => setBatches(response.batches))
      .catch(() => {});
  }, []);

  useEffect(() => {
    billingAPI
      .getCatalog()
      .then((response) => {
        setCatalog(response);
        // Only categories that can actually be billed: with items, or with
        // amounts set for an item-less category.
        setCategories(
          (response.billingCategories || []).filter(
            (category) =>
              category.productIds.length > 0 || category.isValueCategory,
          ),
        );
      })
      .catch((error) =>
        onToast(billingError(error, "Could not load categories."), "error"),
      );
    loadBatches();
  }, [loadBatches, onToast]);

  const imported = useMemo(
    () =>
      sheet && columns
        ? buildTransactions(sheet.rows, columns, { onlySuccessful })
        : { entries: [], skipped: 0, merged: 0, dates: [] },
    [sheet, columns, onlySuccessful],
  );

  const transactions = sheet ? imported.entries : parsePasted(pasted);
  const upiTotal =
    Math.round(
      transactions.reduce((sum, entry) => sum + entry.amount, 0) * 100,
    ) / 100;
  const amountValue = Number(amount) || 0;
  const cashTotal =
    amountMode === "total"
      ? Math.round((amountValue - upiTotal) * 100) / 100
      : amountValue;
  const dayTotal = Math.round((upiTotal + Math.max(0, cashTotal)) * 100) / 100;
  const billCount = Number(totalBills) || 0;
  const cashBills = billCount - transactions.length;

  const targetList = categories
    .map((category) => ({
      categoryId: category.id,
      amount: Number(targets[category.id]) || 0,
    }))
    .filter((target) => target.amount > 0);
  const targetTotal = targetList.reduce(
    (sum, target) => sum + target.amount,
    0,
  );

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const rows = await readSheet(file);
      const detected = detectColumns(rows);
      if (detected.headerIndex < 0) {
        onToast(
          "Could not find a heading row with an amount column in that file.",
          "error",
        );
        return;
      }
      setSheet({ name: file.name, rows });
      setColumns(detected);
      setPlan(null);
      // Use the file's own date as the date of sale when it has just one.
      const { dates } = buildTransactions(rows, detected, { onlySuccessful });
      if (dates.length === 1 && dates[0] <= todayKey()) {
        setDate(dates[0]);
      }
    } catch (error) {
      onToast(error.message || "Could not read that file.", "error");
    }
  };

  const clearImport = () => {
    setSheet(null);
    setColumns(null);
    setPlan(null);
  };

  const problem = (() => {
    if (!transactions.length && !(cashTotal > 0)) {
      return "Add PhonePe transactions or a cash amount.";
    }
    if (cashTotal < 0) {
      return `The day's total is less than the PhonePe total of ${money(upiTotal)}.`;
    }
    if (!billCount) return "Enter the total number of bills.";
    if (cashBills < 0) {
      return `${transactions.length} PhonePe transactions need ${transactions.length} bills; increase the total number of bills.`;
    }
    if (cashTotal > 0 && cashBills === 0) {
      return "All bills are taken by PhonePe transactions; increase the total so the cash has bills too.";
    }
    if (cashTotal === 0 && cashBills > 0) {
      return `${cashBills} bills are left for cash, but the cash amount is ₹0.`;
    }
    if (targetTotal > dayTotal) {
      return `Category amounts (${money(targetTotal)}) are more than the day's total (${money(dayTotal)}).`;
    }
    return "";
  })();

  const generate = async () => {
    setBusy("generate");
    try {
      setPlan(
        await billingAPI.previewAuto({
          date,
          totalBills: billCount,
          amountMode,
          amount: amountValue,
          phonepe: transactions.map((entry) => ({
            amount: entry.amount,
            time: entry.time || "",
            reference: entry.reference || "",
          })),
          categoryTargets: targetList,
          options: { ...options, gapCategoryId },
        }),
      );
      setReviewFilter("all");
    } catch (error) {
      onToast(billingError(error, "Could not generate bills."), "error");
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    setBusy("save");
    try {
      const response = await billingAPI.commitAuto({
        date: plan.date,
        bills: plan.bills.map((bill) => ({
          mode: bill.mode,
          amount: bill.amount,
          time: bill.time,
          reference: bill.reference,
          lines: bill.lines.map(toCommitLine),
        })),
      });
      onToast(
        `${response.saved} bills saved (${response.firstBillNo} to ${response.lastBillNo}) · ${money(response.total)}`,
      );
      setPlan(null);
      clearImport();
      setPasted("");
      setAmount("");
      setTotalBills("");
      setTargets({});
      loadBatches();
    } catch (error) {
      onToast(billingError(error, "Could not save the bills."), "error");
    } finally {
      setBusy("");
    }
  };

  const replaceBill = (tempId, next) =>
    setPlan((current) => ({
      ...current,
      bills: current.bills.map((bill) =>
        bill.tempId === tempId ? next : bill,
      ),
    }));

  // A fresh mix of items for one bill: same amount, time and payment.
  const shuffleBill = async (bill) => {
    setBusy(bill.tempId);
    try {
      const fresh = await billingAPI.previewAuto({
        date: plan.date,
        totalBills: 1,
        amountMode: "cash",
        amount: 0,
        phonepe: [{ amount: bill.amount, time: bill.time, reference: "" }],
        categoryTargets: [],
        options: { ...options, gapCategoryId },
      });
      const [generated] = fresh.bills;
      replaceBill(bill.tempId, {
        ...generated,
        tempId: bill.tempId,
        mode: bill.mode,
        time: bill.time,
        reference: bill.reference,
        edited: false,
      });
    } catch (error) {
      onToast(billingError(error, "Could not shuffle that bill."), "error");
    } finally {
      setBusy("");
    }
  };

  const reverseBatch = async (batch) => {
    const confirmed = window.confirm(
      `Cancel all ${batch.activeBills} bills from the auto-billing run for ${formatDateKey(batch.dateKey)}? They stay in the records marked as cancelled.`,
    );
    if (!confirmed) return;
    try {
      const response = await billingAPI.cancelAutoBatch(batch.id);
      onToast(`${response.cancelled} bills cancelled.`);
      loadBatches();
    } catch (error) {
      onToast(billingError(error, "Could not reverse that run."), "error");
    }
  };

  const setOption = (key) => (event) =>
    setOptions((current) => ({ ...current, [key]: event.target.value }));

  // Live counts for the review, so edits are reflected straight away.
  const review = useMemo(() => {
    if (!plan) return null;
    const bills = plan.bills;
    const cashBillsList = bills.filter((bill) => bill.mode === "cash");
    const cashNow = round2(
      cashBillsList.reduce((sum, bill) => sum + bill.amount, 0),
    );
    return {
      needsFix: bills.filter((bill) => bill.needsFix).length,
      edited: bills.filter((bill) => bill.edited).length,
      gapLines: bills.filter((bill) => bill.lines.some((line) => line.open))
        .length,
      cashNow,
      cashChange: round2(cashNow - plan.totals.cash),
      dayNow: round2(plan.totals.upi + cashNow),
      visible: bills.filter((bill) => {
        if (reviewFilter === "fix") return bill.needsFix;
        if (reviewFilter === "phonepe") return bill.mode === "phonepe";
        if (reviewFilter === "cash") return bill.mode === "cash";
        if (reviewFilter === "edited") return bill.edited;
        return true;
      }),
    };
  }, [plan, reviewFilter]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── The day ── */}
        <Panel title="1. The day">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of sale">
              <input
                type="date"
                value={date}
                max={todayKey()}
                onChange={(event) => setDate(event.target.value || todayKey())}
                className={inputClass}
              />
            </Field>
            <Field label="Total number of bills">
              <input
                type="number"
                min="1"
                step="1"
                value={totalBills}
                onChange={(event) => setTotalBills(event.target.value)}
                placeholder="e.g. 60"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f6f1e6] p-1">
              <button
                type="button"
                className={segmentClass(amountMode === "cash")}
                onClick={() => setAmountMode("cash")}
              >
                Cash amount
              </button>
              <button
                type="button"
                className={segmentClass(amountMode === "total")}
                onClick={() => setAmountMode("total")}
              >
                Day total
              </button>
            </div>
            <input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={
                amountMode === "cash"
                  ? "Cash in the drawer (₹)"
                  : "Total for the day (₹)"
              }
              className={inputClass}
              aria-label={amountMode === "cash" ? "Cash amount" : "Day total"}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowTimes((current) => !current)}
            className="mt-3 text-xs font-semibold text-[#8b6914] hover:underline"
          >
            {showTimes ? "Hide shop timings" : "Shop timings and item limit"}
          </button>
          {showTimes && (
            <div className="mt-2 grid grid-cols-3 gap-3">
              <Field label="Opens">
                <input
                  type="time"
                  value={options.startTime}
                  onChange={setOption("startTime")}
                  className={inputClass}
                />
              </Field>
              <Field label="Closes">
                <input
                  type="time"
                  value={options.endTime}
                  onChange={setOption("endTime")}
                  className={inputClass}
                />
              </Field>
              <Field label="Max qty of one item">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={options.maxQtyPerItem}
                  onChange={setOption("maxQtyPerItem")}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
        </Panel>

        {/* ── PhonePe ── */}
        <Panel
          title="2. PhonePe transactions"
          action={
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv,.txt"
                onChange={importFile}
                className="hidden"
              />
              <ActionButton
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                {sheet ? "Import another file" : "Import Excel / CSV"}
              </ActionButton>
            </>
          }
        >
          {sheet ? (
            <>
              <p className="text-sm text-[#1f1709]">
                <strong>{sheet.name}</strong> ·{" "}
                <button
                  type="button"
                  onClick={clearImport}
                  className="font-semibold text-[#a3271b] hover:underline"
                >
                  Remove
                </button>
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {COLUMN_LABELS.filter(([key]) => key in columns).map(
                  ([key, label]) => (
                    <Field key={key} label={label}>
                      <select
                        value={columns[key]}
                        onChange={(event) => {
                          setPlan(null);
                          setColumns((current) => ({
                            ...current,
                            [key]: Number(event.target.value),
                          }));
                        }}
                        className={inputClass}
                      >
                        <option value={-1}>
                          {key === "amount" ? "Choose…" : "Not in file"}
                        </option>
                        {columns.headers.map((header, index) => (
                          <option key={index} value={index}>
                            {header || `Column ${index + 1}`}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ),
                )}
              </div>
              {columns.status >= 0 && (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-[#1f1709]">
                  <input
                    type="checkbox"
                    checked={onlySuccessful}
                    onChange={(event) => {
                      setPlan(null);
                      setOnlySuccessful(event.target.checked);
                    }}
                    className="h-4 w-4 accent-[#1f1709]"
                  />
                  Only successful payments
                </label>
              )}
              {(imported.skipped > 0 || imported.merged > 0) && (
                <p className="mt-1 text-xs text-[#8a7a5c]">
                  {imported.merged > 0 &&
                    `${imported.merged} gift-voucher row${imported.merged === 1 ? "" : "s"} joined to the same payment. `}
                  {imported.skipped > 0 &&
                    `${imported.skipped} rows left out (refunds, no amount or not successful).`}
                </p>
              )}
              {imported.dates.length > 0 &&
                !(
                  imported.dates.length === 1 && imported.dates[0] === date
                ) && (
                  <p className="mt-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                    This file is for{" "}
                    {imported.dates
                      .map((entry) => formatDateKey(entry))
                      .join(", ")}
                    , but the date of sale is {formatDateKey(date)}.
                  </p>
                )}
              {transactions.length > 0 && (
                <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-[#ebe1cb]">
                  <table className="w-full text-xs">
                    <tbody>
                      {transactions.slice(0, 200).map((entry, index) => (
                        <tr
                          key={index}
                          className="border-b border-[#f3ecdb] last:border-b-0"
                        >
                          <td className="px-2.5 py-1 font-semibold text-[#1f1709]">
                            {money(entry.amount)}
                          </td>
                          <td className="px-2.5 py-1 text-[#7d6c4d]">
                            {entry.when || "—"}
                          </td>
                          <td className="px-2.5 py-1 text-[#7d6c4d]">
                            {entry.reference || "—"}
                          </td>
                          <td className="px-2.5 py-1 text-[#7d6c4d]">
                            {entry.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <Field
              label="Or type / paste the amounts"
              hint="Separated by spaces or new lines. One per line may add a time and ID: 250 14:30 T2411121430"
            >
              <textarea
                value={pasted}
                onChange={(event) => {
                  setPlan(null);
                  setPasted(event.target.value);
                }}
                rows={4}
                placeholder={"120 250 75 480\n340 18:45 T24111218450091"}
                className={`${inputClass} font-mono`}
              />
            </Field>
          )}
          <p className="mt-2 text-sm font-semibold text-[#1f1709]">
            {transactions.length} transaction
            {transactions.length === 1 ? "" : "s"} · {money(upiTotal)}
          </p>
        </Panel>
      </div>

      {/* ── Category amounts ── */}
      <Panel
        title="3. Amount per category (optional)"
        action={
          <span className="text-sm text-[#7d6c4d]">
            Set <strong className="text-[#1f1709]">{money(targetTotal)}</strong>{" "}
            of {money(dayTotal)} · the rest is filled from the other categories
          </span>
        }
      >
        {categories.length ? (
          <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="min-w-0 truncate text-sm text-[#1f1709]">
                  {category.name}
                  {category.isValueCategory && (
                    <span className="text-xs text-[#8a7a5c]"> · amounts</span>
                  )}
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={targets[category.id] || ""}
                  onChange={(event) => {
                    setPlan(null);
                    setTargets((current) => ({
                      ...current,
                      [category.id]: event.target.value,
                    }));
                  }}
                  placeholder="₹"
                  className={`${inputClass} !h-9 w-24 text-right`}
                  aria-label={`${category.name} amount`}
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#7d6c4d]">
            No categories can be billed yet. In Categories &amp; Tax, add items
            to a category or set amounts for it.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#ebe1cb] pt-3">
          <span className="text-sm font-semibold text-[#1f1709]">
            Amounts your prices can't make
          </span>
          <select
            value={gapCategoryId}
            onChange={(event) => {
              setPlan(null);
              setGapCategoryId(event.target.value);
            }}
            className={`${inputClass} w-auto min-w-[220px]`}
            aria-label="Category for amounts your prices cannot make"
          >
            <option value="">Leave them red for me to fix</option>
            {(catalog.billingCategories || []).map((category) => (
              <option key={category.id} value={category.id}>
                Fill with a {category.name} line ({category.gstRate}% GST)
              </option>
            ))}
          </select>
          <span className="text-xs text-[#8a7a5c]">
            Example: a ₹20 PhonePe payment when your cheapest item is ₹25 gets
            one line of this category for the part items can't cover.
          </span>
        </div>
      </Panel>

      {/* ── Summary and generate ── */}
      <div className="ws-card flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
        <div>
          <p className="ws-eyebrow">PhonePe bills</p>
          <p className="text-lg font-bold text-[#1f1709]">
            {transactions.length}{" "}
            <span className="text-sm font-medium text-[#7d6c4d]">
              · {money(upiTotal)}
            </span>
          </p>
        </div>
        <div>
          <p className="ws-eyebrow">Cash bills</p>
          <p className="text-lg font-bold text-[#1f1709]">
            {Math.max(0, cashBills)}{" "}
            <span className="text-sm font-medium text-[#7d6c4d]">
              · {money(Math.max(0, cashTotal))}
            </span>
          </p>
        </div>
        <div>
          <p className="ws-eyebrow">Day total</p>
          <p className="text-lg font-bold text-[#1f1709]">{money(dayTotal)}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {problem && (
            <p className="max-w-sm text-sm text-[#a3271b]">{problem}</p>
          )}
          <ActionButton
            onClick={generate}
            disabled={Boolean(problem) || busy === "generate"}
          >
            {busy === "generate"
              ? "Generating..."
              : plan
                ? "Generate again"
                : "Generate bills"}
          </ActionButton>
        </div>
      </div>

      {/* ── Review ── */}
      {plan && review && (
        <Panel
          title={`4. Review bills for ${formatDateKey(plan.date)}`}
          action={
            <ActionButton
              onClick={save}
              disabled={busy === "save" || review.needsFix > 0}
            >
              {busy === "save"
                ? "Saving..."
                : review.needsFix > 0
                  ? `Fix ${review.needsFix} red bill${review.needsFix === 1 ? "" : "s"} to save`
                  : `Save ${plan.bills.length} bills`}
            </ActionButton>
          }
        >
          {plan.existing && plan.existing.bills > 0 && (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {formatDateKey(plan.date)} already has {plan.existing.bills} bills
              worth {money(plan.existing.sales)}. Saving adds these on top —
              make sure the same takings are not billed twice.
            </p>
          )}

          {review.needsFix > 0 && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              <strong>
                {review.needsFix} bill{review.needsFix === 1 ? "" : "s"} can't
                be made from your prices
              </strong>{" "}
              (for example ₹20 when the cheapest item is ₹25). Either open each
              red bill with <em>Edit</em> and enter what was really sold, or
              choose a category under <em>Amounts your prices can't make</em>{" "}
              above and generate again.
            </div>
          )}

          {review.cashChange !== 0 && (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Edited cash bills now come to {money(review.cashNow)} — that is{" "}
              {review.cashChange > 0 ? "more" : "less"} than the{" "}
              {money(plan.totals.cash)} you entered by{" "}
              <strong>{money(Math.abs(review.cashChange))}</strong>.
            </p>
          )}

          <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Total bills"
              value={plan.bills.length}
              sub={money(review.dayNow)}
            />
            <Stat
              label="PhonePe bills"
              value={plan.counts.upi}
              sub={money(plan.totals.upi)}
            />
            <Stat
              label="Cash bills"
              value={plan.counts.cash}
              sub={money(review.cashNow)}
            />
            <Stat
              label="Status"
              value={review.needsFix ? `${review.needsFix} red` : "All match"}
              sub={
                [
                  review.edited ? `${review.edited} edited` : "",
                  review.gapLines
                    ? `${review.gapLines} with a fill-in line`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Every bill equals its amount"
              }
              className={
                review.needsFix
                  ? "!border-rose-200 !bg-rose-50"
                  : "!border-emerald-200 !bg-emerald-50"
              }
            />
          </div>

          {(plan.targets.length > 0 || plan.categoryTotals.length > 0) && (
            <div className="mb-3 grid gap-4 lg:grid-cols-2">
              {plan.targets.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className={tableHeadClass}>Category amount</th>
                        <th className={`${tableHeadClass} text-right`}>
                          Asked
                        </th>
                        <th className={`${tableHeadClass} text-right`}>
                          Generated
                        </th>
                        <th className={`${tableHeadClass} text-right`}>
                          Difference
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.targets.map((target) => (
                        <tr key={target.categoryId}>
                          <td className={`${tableCellClass} font-semibold`}>
                            {target.name}
                          </td>
                          <td className={`${tableCellClass} text-right`}>
                            {money(target.target)}
                          </td>
                          <td className={`${tableCellClass} text-right`}>
                            {money(target.generated)}
                          </td>
                          <td
                            className={`${tableCellClass} text-right font-semibold ${
                              target.gap ? "text-[#a3271b]" : "text-emerald-700"
                            }`}
                          >
                            {target.gap
                              ? `${target.gap > 0 ? "+" : "−"}${money(Math.abs(target.gap))}`
                              : "Exact"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {plan.targets.some((target) => target.gap) && (
                    <p className="mt-1.5 text-xs text-[#8a7a5c]">
                      A difference means that category's prices can't add up to
                      the amount asked; the closest amount was used.
                    </p>
                  )}
                </div>
              )}
              <div className="flex flex-wrap content-start gap-1.5">
                {plan.categoryTotals.map((entry) => (
                  <span
                    key={entry.categoryId || "none"}
                    className="rounded-full bg-[#f6f1e6] px-2.5 py-1 text-xs text-[#4a3610]"
                  >
                    {entry.name} · <strong>{money(entry.amount)}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {plan.stockUsed?.length > 0 && (
            <details className="mb-3 rounded-xl border border-[#ebe1cb] bg-[#fffdf7] px-3 py-2">
              <summary className="cursor-pointer text-sm font-semibold text-[#1f1709]">
                Stock these bills take: {plan.stockUsed.length} item
                {plan.stockUsed.length === 1 ? "" : "s"} (never more than in
                stock)
              </summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.stockUsed.map((entry) => (
                  <span
                    key={entry.itemId}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900"
                  >
                    {entry.name} · <strong>−{entry.used}</strong> {entry.baseUnit === "pcs" ? "pcs" : entry.baseUnit} ·{" "}
                    {entry.left} left
                  </span>
                ))}
              </div>
            </details>
          )}

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <ChipRow
              options={REVIEW_FILTERS.map((filter) => ({
                ...filter,
                label:
                  filter.value === "fix"
                    ? `Needs fixing (${review.needsFix})`
                    : filter.value === "edited"
                      ? `Edited (${review.edited})`
                      : filter.label,
              }))}
              value={reviewFilter}
              onChange={setReviewFilter}
            />
            <span className="text-xs text-[#7d6c4d]">
              Showing {review.visible.length} of {plan.bills.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={tableHeadClass}>Time</th>
                  <th className={tableHeadClass}>Paid by</th>
                  <th className={tableHeadClass}>Items</th>
                  <th className={`${tableHeadClass} text-right`}>Amount</th>
                  <th className={tableHeadClass} />
                </tr>
              </thead>
              <tbody>
                {review.visible.map((bill) => (
                  <tr
                    key={bill.tempId}
                    className={bill.needsFix ? "bg-rose-50" : ""}
                  >
                    <td className={`${tableCellClass} whitespace-nowrap`}>
                      {formatClock(bill.time)}
                    </td>
                    <td className={tableCellClass}>
                      <ModeChip mode={bill.mode} />
                      {bill.reference && (
                        <span className="mt-1 block max-w-[150px] truncate text-[11px] text-[#7d6c4d]">
                          {bill.reference}
                        </span>
                      )}
                    </td>
                    <td className={tableCellClass}>
                      {bill.lines.map((line) => (
                        <span
                          key={`${line.productId}|${line.variantKey}|${line.categoryId}|${line.name}|${line.unitPrice}`}
                          className={`mb-1 mr-1.5 inline-block rounded-lg px-2 py-0.5 text-xs ${
                            line.open
                              ? "border border-dashed border-[#d9c48a] bg-[#fffaf0] text-[#5c4a26]"
                              : "bg-[#f6f1e6] text-[#4a3610]"
                          }`}
                        >
                          {line.qty} × {line.name}
                          {line.variant ? ` (${line.variant})` : ""} ·{" "}
                          {money(line.lineTotal ?? line.qty * line.unitPrice)}
                        </span>
                      ))}
                      {bill.edited && (
                        <StatusChip tone="info" className="!px-2 !py-0.5">
                          Edited
                        </StatusChip>
                      )}
                      {bill.needsFix && (
                        <span className="block text-xs font-semibold text-rose-700">
                          {bill.lines.length
                            ? `Items come to ${money(bill.itemsTotal)} — short by ${money(bill.shortBy)}.`
                            : `${money(bill.amount)} can't be made from your prices.`}
                        </span>
                      )}
                    </td>
                    <td className={`${tableCellClass} text-right font-bold`}>
                      {money(bill.amount)}
                    </td>
                    <td
                      className={`${tableCellClass} whitespace-nowrap text-right`}
                    >
                      <button
                        type="button"
                        onClick={() => setEditing(bill)}
                        className={`text-sm font-semibold hover:underline ${
                          bill.needsFix ? "text-rose-700" : "text-[#8b6914]"
                        }`}
                      >
                        {bill.needsFix ? "Fix" : "Edit"}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => shuffleBill(bill)}
                        className="ml-3 text-sm font-semibold text-[#5c4a26] hover:underline disabled:opacity-40"
                        title="New mix of items for the same amount"
                      >
                        {busy === bill.tempId ? "…" : "Shuffle"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!review.visible.length && (
              <EmptyState message="No bills in this view." />
            )}
          </div>
        </Panel>
      )}

      {editing && (
        <AutoBillEditor
          bill={editing}
          catalog={catalog}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            replaceBill(next.tempId, next);
            setEditing(null);
          }}
        />
      )}

      <Panel title="Previous auto-billing runs">
        {batches.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={tableHeadClass}>Sale date</th>
                  <th className={tableHeadClass}>Run on</th>
                  <th className={tableHeadClass}>By</th>
                  <th className={`${tableHeadClass} text-right`}>Bills</th>
                  <th className={`${tableHeadClass} text-right`}>Total</th>
                  <th className={tableHeadClass} />
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className={`${tableCellClass} font-semibold`}>
                      {formatDateKey(batch.dateKey)}
                    </td>
                    <td className={`${tableCellClass} text-[#7d6c4d]`}>
                      {new Date(batch.createdAt).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className={`${tableCellClass} text-[#7d6c4d]`}>
                      {batch.createdByName || "—"}
                    </td>
                    <td className={`${tableCellClass} text-right`}>
                      {batch.bills}
                    </td>
                    <td
                      className={`${tableCellClass} text-right font-semibold`}
                    >
                      {money(batch.total)}
                    </td>
                    <td className={`${tableCellClass} text-right`}>
                      {batch.activeBills > 0 ? (
                        <button
                          type="button"
                          onClick={() => reverseBatch(batch)}
                          className="text-sm font-semibold text-rose-700 hover:underline"
                        >
                          Reverse
                        </button>
                      ) : (
                        <StatusChip tone="danger">Reversed</StatusChip>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No auto-billing runs yet." />
        )}
      </Panel>
    </div>
  );
};

export default BillingAutoPage;
