import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/admin/components/ui/AdminUi";
import { ActionButton, StatusChip } from "@/shared/ui/Primitives";
import { billingAPI, billingError } from "@/services/billingAPI";
import {
  Field,
  ModeChip,
  Panel,
  formatClock,
  formatDateKey,
  inputClass,
  money,
  tableCellClass,
  tableHeadClass,
  titleCase,
  todayKey,
} from "@/billing/billingShared";

const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;
const isAmount = (token) => /^\d+(\.\d{1,2})?$/.test(token);

/* Reads the PhonePe box. Two shapes are accepted:
 *   - just amounts, separated by spaces, commas or new lines: "120 250 75"
 *   - one transaction per line with an optional time and reference:
 *     "250 14:30 T2411121430" */
const parsePhonePe = (text) => {
  const entries = [];
  const errors = [];

  String(text || "")
    .split(/\r?\n/)
    .forEach((rawLine, index) => {
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
      if (!amountToken) {
        errors.push(
          `Line ${index + 1}: no amount found in "${rawLine.trim()}"`,
        );
        return;
      }

      const rest = tokens.filter((token) => token !== amountToken);
      const timeToken = rest.find((token) => TIME_PATTERN.test(token));
      entries.push({
        amount: Number(amountToken),
        time: timeToken ? timeToken.padStart(5, "0") : "",
        reference: rest.filter((token) => token !== timeToken).join(" "),
      });
    });

  return { entries, errors };
};

const defaultOptions = {
  startTime: "09:00",
  endTime: "22:00",
  avgBill: 180,
  minBill: 40,
  maxBill: 900,
  cashBillCount: "",
  maxQtyPerItem: 4,
};

const BillingAutoPage = ({ onToast }) => {
  const [date, setDate] = useState(todayKey());
  const [phonepeText, setPhonepeText] = useState("");
  const [cashTotal, setCashTotal] = useState("");
  const [options, setOptions] = useState(defaultOptions);
  const [showOptions, setShowOptions] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [bills, setBills] = useState([]);
  const [existing, setExisting] = useState(null);
  const [previewDate, setPreviewDate] = useState("");
  const [busy, setBusy] = useState("");
  const [batches, setBatches] = useState([]);

  const phonepe = useMemo(() => parsePhonePe(phonepeText), [phonepeText]);
  const phonepeTotal = phonepe.entries.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );

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
        const billable = response.items.filter((item) => item.billable);
        setCategories(
          [...new Set(billable.map((item) => item.category))].sort(),
        );
      })
      .catch(() => {});
    loadBatches();
  }, [loadBatches]);

  const requestOptions = () => ({
    ...options,
    categories: selectedCategories,
  });

  const generate = async () => {
    if (phonepe.errors.length) {
      onToast(phonepe.errors[0], "error");
      return;
    }
    setBusy("generate");
    try {
      const response = await billingAPI.previewAuto({
        date,
        phonepe: phonepe.entries,
        cashTotal: Number(cashTotal) || 0,
        options: requestOptions(),
      });
      setBills(response.bills);
      setExisting(response.existing);
      setPreviewDate(response.date);
    } catch (error) {
      onToast(billingError(error, "Could not generate bills."), "error");
    } finally {
      setBusy("");
    }
  };

  // Re-rolls the items on one bill, keeping its amount, time and payment mode.
  const shuffleBill = async (bill) => {
    setBusy(bill.tempId);
    try {
      const response = await billingAPI.previewAuto({
        date: previewDate,
        phonepe: [
          { amount: bill.amount, time: bill.time, reference: bill.reference },
        ],
        cashTotal: 0,
        options: requestOptions(),
      });
      const fresh = response.bills[0];
      setBills((current) =>
        current.map((entry) =>
          entry.tempId === bill.tempId
            ? { ...fresh, tempId: bill.tempId, mode: bill.mode }
            : entry,
        ),
      );
    } catch (error) {
      onToast(billingError(error, "Could not shuffle that bill."), "error");
    } finally {
      setBusy("");
    }
  };

  const removeBill = (tempId) => {
    setBills((current) => current.filter((entry) => entry.tempId !== tempId));
  };

  const save = async () => {
    setBusy("save");
    try {
      const response = await billingAPI.commitAuto({
        date: previewDate,
        bills: bills.map((bill) => ({
          mode: bill.mode,
          amount: bill.amount,
          time: bill.time,
          reference: bill.reference,
          lines: bill.lines.map((line) => ({
            productId: line.productId,
            variantKey: line.variantKey,
            qty: line.qty,
          })),
        })),
      });
      onToast(
        `${response.saved} bills saved (${response.firstBillNo} to ${response.lastBillNo}) · ${money(response.total)}`,
      );
      setBills([]);
      setExisting(null);
      setPhonepeText("");
      setCashTotal("");
      loadBatches();
    } catch (error) {
      onToast(billingError(error, "Could not save the bills."), "error");
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

  const toggleCategory = (category) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((entry) => entry !== category)
        : [...current, category],
    );
  };

  const setOption = (key) => (event) =>
    setOptions((current) => ({ ...current, [key]: event.target.value }));

  const totals = useMemo(() => {
    const sum = (mode) =>
      bills
        .filter((bill) => bill.mode === mode)
        .reduce((total, bill) => total + bill.amount, 0);
    return {
      phonepe: sum("phonepe"),
      phonepeCount: bills.filter((bill) => bill.mode === "phonepe").length,
      cash: sum("cash"),
      cashCount: bills.filter((bill) => bill.mode === "cash").length,
      discount: bills.reduce((total, bill) => total + (bill.discount || 0), 0),
    };
  }, [bills]);

  const canGenerate =
    (phonepe.entries.length > 0 || Number(cashTotal) > 0) &&
    busy !== "generate";

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4">
            <Field label="Date of sale">
              <input
                type="date"
                value={date}
                max={todayKey()}
                onChange={(event) => setDate(event.target.value || todayKey())}
                className={inputClass}
              />
            </Field>
            <Field
              label="Cash total (₹)"
              hint="Split into several walk-in sized bills."
            >
              <input
                type="number"
                min="0"
                step="1"
                value={cashTotal}
                onChange={(event) => setCashTotal(event.target.value)}
                placeholder="e.g. 8450"
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="PhonePe transactions"
            className="lg:col-span-2"
            hint="One bill per transaction. Type amounts separated by spaces or new lines — or one per line with an optional time and reference, e.g. 250 14:30 T2411121430."
          >
            <textarea
              value={phonepeText}
              onChange={(event) => setPhonepeText(event.target.value)}
              rows={6}
              placeholder={"120 250 75 480\n340 18:45 T24111218450091"}
              className={`${inputClass} font-mono`}
            />
            <span className="mt-1 block text-sm font-semibold text-[#1f1709]">
              {phonepe.entries.length} transaction
              {phonepe.entries.length === 1 ? "" : "s"} · {money(phonepeTotal)}
            </span>
            {phonepe.errors.map((message) => (
              <span
                key={message}
                className="block text-xs font-medium text-rose-700"
              >
                {message}
              </span>
            ))}
          </Field>
        </div>

        <button
          type="button"
          onClick={() => setShowOptions((current) => !current)}
          className="mt-4 text-sm font-semibold text-[#8b6914] hover:underline"
        >
          {showOptions
            ? "Hide options"
            : "More options (timings, bill size, categories)"}
        </button>

        {showOptions && (
          <div className="mt-4 rounded-2xl border border-[#ebe1cb] bg-white/70 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Shop opens">
                <input
                  type="time"
                  value={options.startTime}
                  onChange={setOption("startTime")}
                  className={inputClass}
                />
              </Field>
              <Field label="Shop closes">
                <input
                  type="time"
                  value={options.endTime}
                  onChange={setOption("endTime")}
                  className={inputClass}
                />
              </Field>
              <Field label="Typical cash bill (₹)">
                <input
                  type="number"
                  min="10"
                  value={options.avgBill}
                  onChange={setOption("avgBill")}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Number of cash bills"
                hint="Leave blank to decide automatically."
              >
                <input
                  type="number"
                  min="1"
                  value={options.cashBillCount}
                  onChange={setOption("cashBillCount")}
                  placeholder="Auto"
                  className={inputClass}
                />
              </Field>
              <Field label="Smallest cash bill (₹)">
                <input
                  type="number"
                  min="5"
                  value={options.minBill}
                  onChange={setOption("minBill")}
                  className={inputClass}
                />
              </Field>
              <Field label="Largest cash bill (₹)">
                <input
                  type="number"
                  min="10"
                  value={options.maxBill}
                  onChange={setOption("maxBill")}
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

            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#8b6914]">
              Pick items from{" "}
              {selectedCategories.length
                ? "these categories only"
                : "all categories"}
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = selectedCategories.includes(category);
                return (
                  <button
                    type="button"
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold admin-motion ${
                      active
                        ? "bg-[#1f1709] text-[#f3dd96]"
                        : "border border-[#e3d7bb] bg-white text-[#5c4a26] hover:bg-[#faf6ec]"
                    }`}
                  >
                    {titleCase(category)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <ActionButton onClick={generate} disabled={!canGenerate}>
            {busy === "generate"
              ? "Generating..."
              : bills.length
                ? "Generate again"
                : "Generate bills"}
          </ActionButton>
          <p className="text-sm text-[#7d6c4d]">
            Day total:{" "}
            <strong>{money(phonepeTotal + (Number(cashTotal) || 0))}</strong>.
            Nothing is saved until you review and confirm.
          </p>
        </div>
      </Panel>

      {bills.length > 0 && (
        <Panel
          title={`Review ${bills.length} bills for ${formatDateKey(previewDate)}`}
          action={
            <ActionButton onClick={save} disabled={busy === "save"}>
              {busy === "save" ? "Saving..." : `Save ${bills.length} bills`}
            </ActionButton>
          }
        >
          {existing && existing.bills > 0 && (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {formatDateKey(previewDate)} already has {existing.bills} bills
              worth {money(existing.sales)}
              {existing.autoBills > 0
                ? ` (${existing.autoBills} of them from auto billing)`
                : ""}
              . Saving adds these on top — make sure the same takings are not
              billed twice.
            </p>
          )}

          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            {[
              [
                "PhonePe",
                money(totals.phonepe),
                `${totals.phonepeCount} bills`,
              ],
              ["Cash", money(totals.cash), `${totals.cashCount} bills`],
              [
                "Total",
                money(totals.phonepe + totals.cash),
                `${bills.length} bills`,
              ],
              [
                "Rounding discounts",
                money(totals.discount),
                "Where items could not match exactly",
              ],
            ].map(([label, value, note]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#ebe1cb] bg-white px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8b6914]">
                  {label}
                </p>
                <p className="mt-1 text-xl font-bold text-[#1f1709]">{value}</p>
                <p className="text-xs text-[#7d6c4d]">{note}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={tableHeadClass}>#</th>
                  <th className={tableHeadClass}>Time</th>
                  <th className={tableHeadClass}>Paid by</th>
                  <th className={tableHeadClass}>Items</th>
                  <th className={`${tableHeadClass} text-right`}>Discount</th>
                  <th className={`${tableHeadClass} text-right`}>Total</th>
                  <th className={tableHeadClass} />
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, index) => (
                  <tr key={bill.tempId}>
                    <td className={`${tableCellClass} text-[#7d6c4d]`}>
                      {index + 1}
                    </td>
                    <td className={`${tableCellClass} whitespace-nowrap`}>
                      {formatClock(bill.time)}
                    </td>
                    <td className={tableCellClass}>
                      <ModeChip mode={bill.mode} />
                      {bill.reference && (
                        <span className="mt-1 block text-xs text-[#7d6c4d]">
                          {bill.reference}
                        </span>
                      )}
                    </td>
                    <td className={tableCellClass}>
                      {bill.lines.map((line) => (
                        <span
                          key={`${line.productId}|${line.variantKey}`}
                          className="mb-1 mr-1.5 inline-block rounded-lg bg-[#f6f1e6] px-2 py-0.5 text-xs text-[#4a3610]"
                        >
                          {line.qty} × {line.name}
                          {line.variant ? ` (${line.variant})` : ""} ·{" "}
                          {money(line.lineTotal)}
                        </span>
                      ))}
                    </td>
                    <td
                      className={`${tableCellClass} text-right text-[#7d6c4d]`}
                    >
                      {bill.discount > 0 ? money(bill.discount) : "—"}
                    </td>
                    <td className={`${tableCellClass} text-right font-bold`}>
                      {money(bill.amount)}
                    </td>
                    <td
                      className={`${tableCellClass} whitespace-nowrap text-right`}
                    >
                      <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => shuffleBill(bill)}
                        className="text-sm font-semibold text-[#8b6914] hover:underline disabled:opacity-50"
                      >
                        {busy === bill.tempId ? "..." : "Shuffle"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBill(bill.tempId)}
                        className="ml-3 text-sm font-semibold text-rose-700 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
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
