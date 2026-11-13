import React, { useMemo, useRef, useState } from "react";
import { FiExternalLink, FiFilePlus, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import Modal from "@/shared/ui/Modal";
import { ActionButton, StatusChip } from "@/shared/ui/Primitives";
import { billingAPI, billingError } from "@/services/billingAPI";
import { inputClass, money, todayKey } from "@/billing/billingShared";
import SellOptionsEditor from "@/billing/components/SellOptionsEditor";
import {
  BASE_UNITS,
  isMeasure,
  round,
  shortBase,
  stockLabel,
  unitChoices,
  unitValue,
} from "@/billing/stockUnits";

/* Purchase bill editor — for a bill read by AI, typed in by hand, or opened
 * again from the list. The uploaded file sits beside the form so every
 * line can be checked against it. Rates are before GST unless "Rates
 * include GST" is ticked, in which case they are converted on save. */

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

let lineSeed = 0;
const lineKey = () => {
  lineSeed += 1;
  return `line-${Date.now()}-${lineSeed}`;
};

const emptyLine = () => ({
  key: lineKey(),
  name: "",
  printedName: "",
  freeQty: "",
  packSize: null,
  mrp: "",
  baseUnit: "pcs",
  unitFactor: "1",
  packUnits: [],
  sellOptions: [],
  stockItemId: "",
  stockName: "",
  stockQty: null,
  check: false,
  categoryId: "",
  hsnCode: "",
  qty: "1",
  unit: "pcs",
  rate: "",
  discount: "",
  gstRate: "",
  printedAmount: null,
});

const toFormOptions = (options = []) =>
  options.map((option) => ({
    qty: Number(option.qty),
    label: option.label,
    price: option.price === null || option.price === undefined ? "" : String(option.price),
  }));

const toFormLine = (line) => ({
  key: lineKey(),
  name: line.name || "",
  printedName: line.printedName || "",
  freeQty: line.freeQty ? String(line.freeQty) : "",
  packSize: line.packSize ?? null,
  mrp: line.mrp ? String(line.mrp) : "",
  baseUnit: line.baseUnit || "pcs",
  // null = a pack whose size the bill doesn't say; asked for in the editor.
  unitFactor: line.unitFactor === null ? "" : String(line.unitFactor ?? 1),
  packUnits: line.packUnits || [],
  sellOptions: toFormOptions(line.sellOptions),
  stockItemId: line.stockItemId || "",
  stockName: line.stockName || "",
  stockQty: line.stockQty ?? null,
  check: Boolean(line.check),
  categoryId: line.categoryId || "",
  hsnCode: line.hsnCode || "",
  qty: String(line.qty ?? 1),
  // Only pcs / g / kg / ml / litre or a Box: other pack names become a Box.
  unit: isMeasure({ baseUnit: line.baseUnit || "pcs", unit: line.unit || line.baseUnit || "pcs" })
    ? String(line.unit || line.baseUnit || "pcs").toLowerCase()
    : "Box",
  rate: line.rate === undefined || line.rate === null ? "" : String(line.rate),
  discount: line.discount ? String(line.discount) : "",
  gstRate:
    line.gstRate === undefined || line.gstRate === null ? "" : String(line.gstRate),
  printedAmount: line.printedAmount ?? null,
});

const formFromPurchase =(purchase = {}) => ({
  id: purchase.id || "",
  supplierName: purchase.supplierName || "",
  supplierGstin: purchase.supplierGstin || "",
  supplierPhone: purchase.supplierPhone || "",
  invoiceNo: purchase.invoiceNo || "",
  dateKey: purchase.dateKey || todayKey(),
  taxType: purchase.taxType || "intra",
  ratesIncludeGst: false,
  lines: purchase.lines?.length
    ? purchase.lines.map(toFormLine)
    : [emptyLine()],
  otherCharges: purchase.otherCharges ? String(purchase.otherCharges) : "",
  lessDiscount: purchase.lessDiscount ? String(purchase.lessDiscount) : "",
  roundOff: purchase.roundOff ? String(purchase.roundOff) : "",
  billTotal:
    purchase.billTotal === null || purchase.billTotal === undefined
      ? ""
      : String(purchase.billTotal),
  notes: purchase.notes || "",
  source: purchase.source || "manual",
  attachments: purchase.attachments?.length
    ? purchase.attachments
    : purchase.attachment?.url
      ? [purchase.attachment]
      : [],
});

// "4%" in the discount box means 4% of the line's value.
const discountValue = (line, includesGst) => {
  const raw = String(line.discount || "").trim();
  if (raw.endsWith("%")) {
    const percent = Number(raw.slice(0, -1)) || 0;
    return ((Number(line.qty) || 0) * baseRate(line, includesGst) * percent) / 100;
  }
  return Number(raw) || 0;
};

// Rate before GST for a line, given the bill's "rates include GST" choice.
const baseRate = (line, includesGst) => {
  const rate = Number(line.rate) || 0;
  const gst = Number(line.gstRate) || 0;
  return includesGst && gst ? rate / (1 + gst / 100) : rate;
};

const computeLine = (line, includesGst) => {
  const taxable = round2(
    (Number(line.qty) || 0) * baseRate(line, includesGst) -
      discountValue(line, includesGst),
  );
  const gst = round2((taxable * (Number(line.gstRate) || 0)) / 100);
  return { taxable, gst, amount: round2(taxable + gst) };
};

const cellInput = `${inputClass} !px-2 !py-1.5 text-sm`;

const FilePreview = ({ attachments, onRemove }) => {
  const [page, setPage] = useState(0);
  const attachment = attachments[Math.min(page, attachments.length - 1)];
  if (!attachment?.url) return null;
  const isImage = attachment.mimeType?.startsWith("image/");
  const isPdf =
    attachment.mimeType === "application/pdf" ||
    /\.pdf$/i.test(attachment.fileName || "");
  return (
    <div className="flex h-full flex-col gap-2">
      {attachments.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {attachments.map((entry, index) => (
            <span
              key={entry.publicId || entry.url}
              className={`inline-flex items-center gap-1 rounded-full pl-2.5 text-xs font-semibold ${
                index === page
                  ? "bg-[#1f1709] text-[#f3dd96]"
                  : "bg-[#f6f1e6] text-[#5c4a26]"
              }`}
            >
              <button type="button" onClick={() => setPage(index)} className="py-1">
                Page {index + 1}
              </button>
              <button
                type="button"
                aria-label={`Remove page ${index + 1}`}
                onClick={() => {
                  onRemove(index);
                  setPage(0);
                }}
                className="rounded-full p-1 opacity-70 hover:opacity-100"
              >
                <FiX />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 text-xs text-[#7d6c4d]">
        <span className="truncate">{attachment.fileName || "Bill file"}</span>
        <a
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#8b6914] hover:underline"
        >
          Open <FiExternalLink />
        </a>
      </div>
      {isImage && (
        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[#ebe1cb] bg-white">
          <img src={attachment.url} alt="Supplier bill" className="w-full" />
        </div>
      )}
      {isPdf && (
        <iframe
          title="Supplier bill"
          src={attachment.url}
          className="min-h-[420px] w-full flex-1 rounded-xl border border-[#ebe1cb] bg-white"
        />
      )}
      {!isImage && !isPdf && (
        <p className="rounded-xl border border-dashed border-[#d9c48a] bg-[#fffaf0] p-4 text-sm text-[#5c4a26]">
          Spreadsheet attached. Use Open to view it.
        </p>
      )}
    </div>
  );
};

const PurchaseEditor = ({
  initial,
  categories,
  stockItems = [],
  suppliers,
  readNote,
  aiEnabled,
  onClose,
  onSaved,
  onDeleted,
  onToast,
}) => {
  const [form, setForm] = useState(() => formFromPurchase(initial));
  const [saving, setSaving] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [pageNote, setPageNote] = useState(null);
  const pageInput = useRef(null);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const setLine = (key, patch) =>
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.key === key ? { ...line, ...patch } : line,
      ),
    }));

  const chooseCategory = (key, categoryId) => {
    const category = categoriesById.get(categoryId);
    setLine(
      key,
      category
        ? {
            categoryId,
            hsnCode: category.hsnCode || "",
            gstRate: String(category.gstRate ?? ""),
          }
        : { categoryId: "" },
    );
  };

  const stockById = useMemo(
    () => new Map(stockItems.map((item) => [item.id, item])),
    [stockItems],
  );

  // Link a line to an existing stock item (its details fill in), or make
  // it a new one.
  const chooseStock = (key, stockItemId) => {
    const item = stockById.get(stockItemId);
    if (!item) {
      setLine(key, { stockItemId: "", stockName: "", stockQty: null });
      return;
    }
    const category = categoriesById.get(item.categoryId);
    setLine(key, {
      stockItemId: item.id,
      stockName: item.name,
      stockQty: item.stockQty,
      name: item.name,
      ...(category
        ? { categoryId: category.id, hsnCode: item.hsnCode || category.hsnCode || "" }
        : {}),
      baseUnit: item.baseUnit,
      packUnits: item.packUnits,
      ...(item.sellOptions?.length ? { sellOptions: toFormOptions(item.sellOptions) } : {}),
    });
    // Keep the billed unit, sized by the item's own packs where it has one.
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.key !== key) return line;
        // A measure (pcs, kg …) stays; a Box keeps its size, or takes the
        // item's only box size when it has none yet.
        const sizes = (item.packUnits || []).map((pack) => pack.factor);
        const measure = isMeasure({ ...line, baseUnit: item.baseUnit });
        const factor = measure
          ? Number(line.unitFactor) || 1
          : Number(line.unitFactor) > 0
            ? Number(line.unitFactor)
            : sizes.length === 1
              ? sizes[0]
              : 0;
        return {
          ...line,
          unit: measure ? line.unit : "Box",
          unitFactor: factor ? String(factor) : "",
          mrp: line.mrp || (item.mrp ? String(round(item.mrp * factor, 2)) : ""),
        };
      }),
    }));
  };

  // Typing a name that matches a stock item links the line to it; changing
  // a linked line's name makes it a new item.
  const typeName = (key, name) => {
    const match = stockItems.find(
      (item) => item.name.toLowerCase() === name.trim().toLowerCase(),
    );
    setLine(key, { name, check: false });
    if (match) {
      chooseStock(key, match.id);
      return;
    }
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.key === key && line.stockItemId && line.stockName.toLowerCase() !== name.trim().toLowerCase()
          ? { ...line, stockItemId: "", stockName: "", stockQty: null, packUnits: [] }
          : line,
      ),
    }));
  };

  /* Qty, rate, rate + GST and amount are tied together: typing any one
   * works out the rest. The rate before GST is what is stored; typing the
   * rate with GST or the line amount works back to it (amount keeps the
   * line's discount). While a box is being typed in, its text is kept as
   * typed (drafts) so decimals can be entered. */
  const typeDerived = (key, field, text) =>
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.key !== key) return line;
        const gst = 1 + (Number(line.gstRate) || 0) / 100;
        const value = Number(text);
        let rate = line.rate;
        if (value > 0) {
          if (field === "rateInc") {
            rate = String(round(value / gst, 4));
          } else {
            const qty = Number(line.qty) > 0 ? Number(line.qty) : 1;
            const discount = discountValue(line, false);
            rate = String(round((value / gst + discount) / qty, 4));
          }
        }
        return { ...line, rate, check: false, drafts: { [field]: text } };
      }),
    }));

  const endDraft = (key, field) =>
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.key === key && line.drafts?.[field] !== undefined
          ? { ...line, drafts: { ...line.drafts, [field]: undefined } }
          : line,
      ),
    }));

  const chooseUnit = (key, value) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line) => {
        if (line.key !== key) return line;
        if (value === "__new") return { ...line, unit: "Box", unitFactor: "" };
        const choice = unitChoices(line).find((entry) => entry.value === value);
        return {
          ...line,
          unit: choice ? choice.name : value,
          unitFactor: String(choice?.factor ?? 1),
        };
      }),
    }));
  };

  const chooseSupplier = (event) => {
    const name = event.target.value;
    const known = suppliers.find(
      (supplier) => supplier.name.toLowerCase() === name.trim().toLowerCase(),
    );
    setForm((current) => ({
      ...current,
      supplierName: name,
      ...(known
        ? {
            supplierGstin: current.supplierGstin || known.gstin,
            supplierPhone: current.supplierPhone || known.phone,
            taxType: known.taxType || current.taxType,
          }
        : {}),
    }));
  };

  const totals = useMemo(() => {
    const lines = form.lines.map((line) => ({
      ...line,
      ...computeLine(line, form.ratesIncludeGst),
    }));
    const taxable = round2(lines.reduce((sum, line) => sum + line.taxable, 0));
    const gst = round2(lines.reduce((sum, line) => sum + line.gst, 0));
    const beforeRound = round2(
      taxable +
        gst +
        (Number(form.otherCharges) || 0) -
        (Number(form.lessDiscount) || 0),
    );
    const total = round2(beforeRound + (Number(form.roundOff) || 0));
    const byRate = new Map();
    lines.forEach((line) => {
      const rate = Number(line.gstRate) || 0;
      const entry = byRate.get(rate) || { rate, taxable: 0, gst: 0 };
      entry.taxable += line.taxable;
      entry.gst += line.gst;
      byRate.set(rate, entry);
    });
    const billTotal = form.billTotal === "" ? null : Number(form.billTotal);
    return {
      lines,
      taxable,
      gst,
      half: round2(gst / 2),
      beforeRound,
      total,
      byRate: [...byRate.values()].sort((a, b) => a.rate - b.rate),
      difference:
        billTotal === null || !Number.isFinite(billTotal)
          ? null
          : round2(total - billTotal),
    };
  }, [form]);

  const roundToRupee = () =>
    setForm((current) => ({
      ...current,
      roundOff: String(
        round2(Math.round(totals.beforeRound) - totals.beforeRound),
      ),
    }));

  const payload = (allowDuplicate) => ({
    supplierName: form.supplierName,
    supplierGstin: form.supplierGstin,
    supplierPhone: form.supplierPhone,
    invoiceNo: form.invoiceNo,
    dateKey: form.dateKey,
    taxType: form.taxType,
    lines: form.lines
      .filter((line) => line.name.trim() || Number(line.rate))
      .map((line) => ({
        name: line.name,
        categoryId: line.categoryId,
        hsnCode: line.hsnCode,
        qty: Number(line.qty),
        unit: line.unit,
        printedName: line.printedName,
        freeQty: Number(line.freeQty) || 0,
        packSize: line.packSize,
        mrp: line.mrp === "" ? null : Number(line.mrp),
        stockItemId: line.stockItemId,
        baseUnit: line.baseUnit,
        unitFactor: Number(line.unitFactor) || 0,
        sellOptions: line.sellOptions
          .filter((option) => option.price !== "")
          .map((option) => ({ qty: option.qty, label: option.label, price: Number(option.price) })),
        rate: round(baseRate(line, form.ratesIncludeGst), 4),
        discount: round2(discountValue(line, form.ratesIncludeGst)),
        gstRate: Number(line.gstRate) || 0,
      })),
    otherCharges: Number(form.otherCharges) || 0,
    lessDiscount: Number(form.lessDiscount) || 0,
    roundOff: Number(form.roundOff) || 0,
    billTotal: form.billTotal === "" ? null : Number(form.billTotal),
    notes: form.notes,
    source: form.source,
    attachments: form.attachments,
    allowDuplicate,
  });

  const save = async (allowDuplicate = false) => {
    setSaving(true);
    try {
      const body = payload(allowDuplicate);
      const response = form.id
        ? await billingAPI.updatePurchase(form.id, body)
        : await billingAPI.createPurchase(body);
      onToast(form.id ? "Purchase updated." : "Purchase saved.");
      onSaved(response.purchase);
    } catch (error) {
      if (error?.response?.status === 409 && !allowDuplicate) {
        setSaving(false);
        if (
          window.confirm(
            `${billingError(error)}\n\nSave this one as well?`,
          )
        ) {
          save(true);
        }
        return;
      }
      onToast(billingError(error, "Could not save the purchase."), "error");
    }
    setSaving(false);
  };

  // Another page of the same bill: stored, read (when AI is on) and its
  // lines added after the ones already here.
  const addPage = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = "";
    if (!file) return;
    setAddingPage(true);
    setPageNote(null);
    try {
      const result = await billingAPI.uploadPurchaseBill({
        files: [file],
        read: aiEnabled,
      });
      const draft = result.draft;
      setForm((current) => {
        const hasLines = current.lines.some((line) => line.name.trim());
        const lines = draft?.lines?.length
          ? [...(hasLines ? current.lines : []), ...draft.lines.map(toFormLine)]
          : current.lines;
        const pick = (key) => current[key] || (draft?.[key] ?? "");
        return {
          ...current,
          supplierName: pick("supplierName"),
          supplierGstin: pick("supplierGstin"),
          invoiceNo: pick("invoiceNo"),
          lines,
          // Totals are usually on the last page.
          billTotal:
            draft?.billTotal !== null && draft?.billTotal !== undefined
              ? String(draft.billTotal)
              : current.billTotal,
          roundOff: draft?.roundOff ? String(draft.roundOff) : current.roundOff,
          attachments: [...current.attachments, ...(result.attachments || [])],
        };
      });
      setPageNote(
        result.readError
          ? { tone: "error", text: `Page added. ${result.readError}` }
          : draft
            ? { tone: "info", text: `Page added: ${draft.lines.length} more line${draft.lines.length === 1 ? "" : "s"} read.` }
            : { tone: "info", text: "Page added." },
      );
    } catch (error) {
      onToast(billingError(error, "Could not add the page."), "error");
    } finally {
      setAddingPage(false);
    }
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Delete bill ${form.invoiceNo || ""} from ${form.supplierName}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await billingAPI.deletePurchase(form.id);
      onToast("Purchase deleted.");
      onDeleted(form.id);
    } catch (error) {
      onToast(billingError(error, "Could not delete the purchase."), "error");
      setSaving(false);
    }
  };

  const uncategorised = form.lines.filter(
    (line) => line.name.trim() && !line.categoryId,
  ).length;
  const toCheck = form.lines.filter((line) => line.check).length;
  const namedLines = form.lines.filter((line) => line.name.trim());
  const newItems = namedLines.filter((line) => !line.stockItemId).length;
  const noMrp = namedLines.filter((line) => line.mrp === "").length;
  const noSelling = namedLines.filter(
    (line) => !line.sellOptions.some((option) => option.price !== ""),
  ).length;
  const noUnitSize = namedLines.filter((line) => !(Number(line.unitFactor) > 0)).length;

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-[#5c4a26]">
        Total <strong className="text-lg text-[#1f1709]">{money(totals.total)}</strong>
        {totals.difference !== null && (
          <span
            className={`ml-2 font-semibold ${
              Math.abs(totals.difference) < 1 ? "text-emerald-700" : "text-[#a3271b]"
            }`}
          >
            {Math.abs(totals.difference) < 1
              ? "· matches the bill"
              : `· ${money(Math.abs(totals.difference))} ${
                  totals.difference > 0 ? "more" : "less"
                } than the bill`}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {form.id && (
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-[#a3271b] hover:bg-rose-50 disabled:opacity-40"
          >
            Delete
          </button>
        )}
        <ActionButton
          variant="secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </ActionButton>
        <ActionButton onClick={() => save(false)} disabled={saving}>
          {saving ? "Saving..." : form.id ? "Save changes" : "Save purchase"}
        </ActionButton>
      </div>
    </div>
  );

  return (
    <Modal
      title={form.id ? "Purchase bill" : "New purchase bill"}
      badge={
        form.source === "ai" ? (
          <StatusChip tone="info">Read by AI · check it</StatusChip>
        ) : null
      }
      onClose={onClose}
      footer={footer}
      maxWidthClassName="max-w-[1400px]"
    >
      <div
        className={
          form.attachments.length
            ? "grid gap-4 lg:grid-cols-[minmax(280px,2fr)_5fr]"
            : ""
        }
      >
        {form.attachments.length > 0 && (
          <div className="lg:sticky lg:top-0 lg:h-[72vh]">
            <FilePreview
              attachments={form.attachments}
              onRemove={(index) =>
                setForm((current) => ({
                  ...current,
                  attachments: current.attachments.filter((_, at) => at !== index),
                }))
              }
            />
          </div>
        )}

        <div className="min-w-0 space-y-4">
          {pageNote && (
            <p
              className={`rounded-xl border px-3 py-2 text-sm ${
                pageNote.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-sky-200 bg-sky-50 text-sky-900"
              }`}
            >
              {pageNote.text}
            </p>
          )}
          {readNote && (
            <p
              className={`rounded-xl border px-3 py-2 text-sm ${
                readNote.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-sky-200 bg-sky-50 text-sky-900"
              }`}
            >
              {readNote.text}
            </p>
          )}

          {/* Supplier and bill details */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <label className="col-span-2 block md:col-span-1">
              <span className="ws-eyebrow">Supplier</span>
              <input
                value={form.supplierName}
                onChange={chooseSupplier}
                list="purchase-suppliers"
                placeholder="Who sold it"
                className={inputClass}
              />
              <datalist id="purchase-suppliers">
                {suppliers.map((supplier) => (
                  <option key={supplier.name} value={supplier.name} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="ws-eyebrow">Bill no.</span>
              <input
                value={form.invoiceNo}
                onChange={set("invoiceNo")}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="ws-eyebrow">Bill date</span>
              <input
                type="date"
                value={form.dateKey}
                max={todayKey()}
                onChange={set("dateKey")}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="ws-eyebrow">Supplier GSTIN</span>
              <input
                value={form.supplierGstin}
                onChange={set("supplierGstin")}
                placeholder="Optional"
                className={`${inputClass} uppercase`}
              />
            </label>
            <label className="block">
              <span className="ws-eyebrow">Phone</span>
              <input
                value={form.supplierPhone}
                onChange={set("supplierPhone")}
                placeholder="Optional"
                className={inputClass}
              />
            </label>
            <div className="col-span-2 md:col-span-1">
              <span className="ws-eyebrow">GST charged as</span>
              <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl bg-[#f6f1e6] p-1">
                {[
                  ["intra", "CGST + SGST"],
                  ["inter", "IGST"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, taxType: value }))
                    }
                    className={`rounded-lg py-1.5 text-sm font-semibold ${
                      form.taxType === value
                        ? "bg-white text-[#1f1709] shadow-sm"
                        : "text-[#7d6c4d]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1f1709]">
                Items ({form.lines.length})
                {uncategorised > 0 && (
                  <span className="ml-2 font-semibold text-amber-700">
                    {uncategorised} without a category
                  </span>
                )}
                {toCheck > 0 && (
                  <span className="ml-2 font-semibold text-rose-700">
                    {toCheck} to check
                  </span>
                )}
                <span className="ml-2 font-normal text-[#7d6c4d]">
                  {namedLines.length - newItems} add to stock items
                  {newItems ? ` · ${newItems} new` : ""}
                  {noMrp ? ` · ${noMrp} without MRP` : ""}
                  {noSelling ? ` · ${noSelling} without selling price` : ""}
                  {noUnitSize ? ` · ${noUnitSize} pack size missing` : ""}
                </span>
              </h3>
              <input
                ref={pageInput}
                type="file"
                accept="image/*,application/pdf,.pdf"
                className="hidden"
                onChange={addPage}
              />
              <button
                type="button"
                disabled={addingPage}
                onClick={() => pageInput.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-[#8b6914] hover:bg-[#faf6ec] disabled:opacity-50"
              >
                <FiFilePlus />
                {addingPage
                  ? aiEnabled
                    ? "Reading page…"
                    : "Adding page…"
                  : "Add page"}
              </button>
            </div>
            <datalist id="purchase-stock-names">
              {stockItems.map((item) => (
                <option key={item.id} value={item.name}>
                  {stockLabel(item.stockQty, item.baseUnit, item.packUnits)} in stock
                </option>
              ))}
            </datalist>
            <div className="overflow-x-auto rounded-xl border border-[#ebe1cb]">
              <table className="w-full min-w-[1260px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-[#faf6ec] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7d6c4d]">
                    <th className="px-2 py-2">Item</th>
                    <th className="w-[150px] px-2 py-2">Category</th>
                    <th className="w-[84px] px-2 py-2">HSN</th>
                    <th className="w-[72px] px-2 py-2 text-right">Qty</th>
                    <th className="w-[60px] px-2 py-2 text-right">Free</th>
                    <th className="w-[150px] px-2 py-2">Unit</th>
                    <th className="w-[92px] px-2 py-2 text-right" title="Price of one unit before GST (S.Rate / Rate on the bill)">
                      Rate
                      <span className="block font-normal normal-case tracking-normal">before GST</span>
                    </th>
                    <th className="w-[76px] px-2 py-2 text-right" title="₹ amount, or a percentage like 4%">Disc ₹/%</th>
                    <th className="w-[68px] px-2 py-2 text-right">GST %</th>
                    <th className="w-[92px] px-2 py-2 text-right" title="Price of one unit with GST (D.Price / Rate incl. of tax on the bill)">
                      Rate
                      <span className="block font-normal normal-case tracking-normal">with GST</span>
                    </th>
                    <th className="w-[104px] px-2 py-2 text-right" title="Line total with GST">
                      Amount
                      <span className="block font-normal normal-case tracking-normal">with GST</span>
                    </th>
                    <th className="w-[96px] px-2 py-2 text-right">MRP / unit</th>
                    <th className="w-[36px]" />
                  </tr>
                </thead>
                <tbody>
                  {totals.lines.map((line) => {
                    const printedOff =
                      line.printedAmount !== null &&
                      Math.abs(line.amount - line.printedAmount) >= 1 &&
                      Math.abs(line.taxable - line.printedAmount) >= 1;
                    const factor = Number(line.unitFactor) || 0;
                    const intoStock = round(((Number(line.qty) || 0) + (Number(line.freeQty) || 0)) * factor, 3);
                    const mrpPerBase = factor > 0 && Number(line.mrp) > 0 ? Number(line.mrp) / factor : 0;
                    const lockedBase = Boolean(line.stockItemId) && stockById.get(line.stockItemId)?.purchasedQty > 0;
                    const rowTone = line.check ? "bg-rose-50/70" : "";
                    return (
                      <React.Fragment key={line.key}>
                      <tr
                        className={`align-top ${rowTone}`}
                        title={line.check ? "The numbers on this line don't agree with each other. Check it against the bill." : undefined}
                      >
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <input
                            value={line.name}
                            onChange={(event) => typeName(line.key, event.target.value)}
                            list="purchase-stock-names"
                            placeholder="Item name"
                            className={cellInput}
                          />
                          {line.printedName &&
                            line.printedName.toLowerCase() !== line.name.toLowerCase() && (
                              <span className="mt-0.5 block truncate px-1 text-[11px] text-[#8a7a5c]">
                                On bill: {line.printedName}
                              </span>
                            )}
                          <span
                            className={`mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                              line.stockItemId ? "bg-emerald-50 text-emerald-800" : "bg-sky-50 text-sky-800"
                            }`}
                          >
                            {line.stockItemId
                              ? `Adds to stock: ${line.stockName}${
                                  line.stockQty !== null && line.stockQty !== undefined
                                    ? ` (now ${stockLabel(line.stockQty, line.baseUnit, line.packUnits)})`
                                    : ""
                                }`
                              : "New stock item"}
                            {line.stockItemId && (
                              <button
                                type="button"
                                onClick={() => chooseStock(line.key, "")}
                                className="ml-1 underline"
                                title="Make this a new stock item instead"
                              >
                                not this
                              </button>
                            )}
                          </span>
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <select
                            value={line.categoryId}
                            onChange={(event) =>
                              chooseCategory(line.key, event.target.value)
                            }
                            className={`${cellInput} ${
                              line.categoryId ? "" : "!border-amber-300 !bg-amber-50"
                            }`}
                          >
                            <option value="">Choose…</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <input
                            value={line.hsnCode}
                            onChange={(event) =>
                              setLine(line.key, { hsnCode: event.target.value })
                            }
                            className={cellInput}
                          />
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.qty}
                            onChange={(event) =>
                              setLine(line.key, { qty: event.target.value, check: false, drafts: {} })
                            }
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.freeQty}
                            onChange={(event) =>
                              setLine(line.key, { freeQty: event.target.value })
                            }
                            placeholder="0"
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <select
                            value={unitValue(line)}
                            onChange={(event) => chooseUnit(line.key, event.target.value)}
                            className={cellInput}
                            aria-label="Unit"
                          >
                            {unitChoices(line).map((choice) => (
                              <option key={choice.value} value={choice.value}>
                                {choice.label}
                              </option>
                            ))}
                          </select>
                          {!isMeasure(line) && (
                            <span className="mt-1 flex items-center gap-1 text-[11px] text-[#7d6c4d]">
                              1 Box =
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={line.unitFactor}
                                onChange={(event) => setLine(line.key, { unitFactor: event.target.value })}
                                className={`w-[48px] rounded border px-1 py-0.5 text-right ${
                                  Number(line.unitFactor) > 0 ? "border-[#e5d9bf]" : "border-amber-300 bg-amber-50"
                                }`}
                                aria-label={`${shortBase(line.baseUnit)} in one ${line.unit}`}
                              />
                              {shortBase(line.baseUnit)}
                            </span>
                          )}
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.rate}
                            onChange={(event) =>
                              setLine(line.key, { rate: event.target.value, check: false, drafts: {} })
                            }
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <input
                            inputMode="decimal"
                            value={line.discount}
                            onChange={(event) =>
                              setLine(line.key, { discount: event.target.value, check: false, drafts: {} })
                            }
                            placeholder="0"
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.gstRate}
                            onChange={(event) =>
                              setLine(line.key, { gstRate: event.target.value, drafts: {} })
                            }
                            className={`${cellInput} text-right`}
                          />
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={
                              line.drafts?.rateInc ??
                              (Number(line.rate) > 0
                                ? String(round(Number(line.rate) * (1 + (Number(line.gstRate) || 0) / 100), 3))
                                : "")
                            }
                            onChange={(event) => typeDerived(line.key, "rateInc", event.target.value)}
                            onBlur={() => endDraft(line.key, "rateInc")}
                            className={`${cellInput} text-right`}
                            aria-label="Rate with GST"
                          />
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.drafts?.amount ?? (line.amount ? String(line.amount) : "")}
                            onChange={(event) => typeDerived(line.key, "amount", event.target.value)}
                            onBlur={() => endDraft(line.key, "amount")}
                            className={`${cellInput} text-right font-semibold`}
                            aria-label="Amount with GST"
                          />
                          {printedOff && (
                            <span className="block text-[11px] font-semibold text-amber-700">
                              Bill: {money(line.printedAmount)}
                            </span>
                          )}
                        </td>
                        <td className="border-t border-[#f3ecdb] px-1.5 py-1.5">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.mrp}
                            onChange={(event) =>
                              setLine(line.key, { mrp: event.target.value })
                            }
                            placeholder="Add"
                            className={`${cellInput} text-right ${
                              line.name.trim() && line.mrp === "" ? "!border-amber-300 !bg-amber-50" : ""
                            }`}
                          />
                          {mrpPerBase > 0 && factor !== 1 && (
                            <span className="mt-0.5 block text-right text-[11px] text-[#8a7a5c]">
                              ₹{round(mrpPerBase, 2)}/{line.baseUnit === "pcs" ? "pc" : shortBase(line.baseUnit)}
                            </span>
                          )}
                        </td>
                        <td className="border-t border-[#f3ecdb] py-1.5 pr-1.5 text-right">
                          <button
                            type="button"
                            aria-label="Remove item"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                lines:
                                  current.lines.length > 1
                                    ? current.lines.filter(
                                        (entry) => entry.key !== line.key,
                                      )
                                    : [emptyLine()],
                              }))
                            }
                            className="rounded-lg p-2 text-[#a3271b] hover:bg-rose-50"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                      <tr className={rowTone}>
                        <td colSpan={12} className="px-2 pb-2.5 pt-0.5">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg bg-[#faf6ec] px-2.5 py-1.5">
                            <span className="text-xs text-[#5c4a26]">
                              Into stock:{" "}
                              <strong className="text-[#1f1709]">
                                {factor > 0
                                  ? `${intoStock} ${shortBase(line.baseUnit)}`
                                  : "set the pack size"}
                              </strong>
                            </span>
                            <label className="flex items-center gap-1 text-xs text-[#5c4a26]">
                              Count stock in
                              <select
                                value={line.baseUnit}
                                disabled={lockedBase}
                                onChange={(event) => {
                                  const baseUnit = event.target.value;
                                  const unit = baseUnit === "pcs" ? "pcs" : baseUnit;
                                  setLine(line.key, {
                                    baseUnit,
                                    unit,
                                    unitFactor: "1",
                                    sellOptions: [],
                                  });
                                }}
                                className="rounded border border-[#e5d9bf] bg-white px-1 py-0.5 text-xs disabled:opacity-60"
                                title={lockedBase ? "This item already has stock in this unit" : undefined}
                              >
                                {BASE_UNITS.map((entry) => (
                                  <option key={entry.value} value={entry.value}>
                                    {entry.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <SellOptionsEditor
                              compact
                              baseUnit={line.baseUnit}
                              packUnits={[
                                ...(line.packUnits || []),
                                ...(!isMeasure(line) && factor > 1 ? [{ name: line.unit, factor }] : []),
                              ]}
                              options={line.sellOptions}
                              pricePerBase={mrpPerBase}
                              onChange={(sellOptions) => setLine(line.key, { sellOptions })}
                            />
                          </div>
                        </td>
                      </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  lines: [...current.lines, emptyLine()],
                }))
              }
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#8b6914] hover:bg-[#faf6ec]"
            >
              <FiPlus /> Add item
            </button>
          </div>

          {/* Totals */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-[#ebe1cb]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#faf6ec] text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7d6c4d]">
                      <th className="px-3 py-1.5">GST %</th>
                      <th className="px-3 py-1.5 text-right">Taxable</th>
                      <th className="px-3 py-1.5 text-right">
                        {form.taxType === "inter" ? "IGST" : "CGST + SGST"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {totals.byRate.map((entry) => (
                      <tr key={entry.rate} className="border-t border-[#f3ecdb]">
                        <td className="px-3 py-1.5">{entry.rate}%</td>
                        <td className="px-3 py-1.5 text-right">
                          {money(round2(entry.taxable))}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          {form.taxType === "inter"
                            ? money(round2(entry.gst))
                            : `${money(round2(entry.gst / 2))} + ${money(round2(entry.gst / 2))}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="block">
                <span className="ws-eyebrow">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={set("notes")}
                  rows={2}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="space-y-1.5 rounded-xl bg-[#faf6ec] p-3 text-sm">
              <div className="flex justify-between">
                <span>Taxable value</span>
                <span>{money(totals.taxable)}</span>
              </div>
              {form.taxType === "inter" ? (
                <div className="flex justify-between">
                  <span>IGST</span>
                  <span>{money(totals.gst)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>CGST</span>
                    <span>{money(totals.half)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST</span>
                    <span>{money(round2(totals.gst - totals.half))}</span>
                  </div>
                </>
              )}
              <label className="flex items-center justify-between gap-3">
                <span>Other charges (freight, packing)</span>
                <input
                  type="number"
                  step="any"
                  value={form.otherCharges}
                  onChange={set("otherCharges")}
                  className={`${cellInput} !w-28 text-right`}
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Less: deduction (credit note, cash discount)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.lessDiscount}
                  onChange={set("lessDiscount")}
                  className={`${cellInput} !w-28 text-right`}
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>
                  Round off{" "}
                  <button
                    type="button"
                    onClick={roundToRupee}
                    className="ml-1 text-xs font-semibold text-[#8b6914] hover:underline"
                  >
                    to nearest ₹
                  </button>
                </span>
                <input
                  type="number"
                  step="any"
                  value={form.roundOff}
                  onChange={set("roundOff")}
                  className={`${cellInput} !w-28 text-right`}
                />
              </label>
              <div className="flex justify-between border-t border-[#e5d9bf] pt-2 text-base font-bold text-[#1f1709]">
                <span>Total</span>
                <span>{money(totals.total)}</span>
              </div>
              <label className="flex items-center justify-between gap-3 pt-1">
                <span>Total printed on the bill</span>
                <input
                  type="number"
                  step="any"
                  value={form.billTotal}
                  onChange={set("billTotal")}
                  placeholder="To check"
                  className={`${cellInput} !w-28 text-right`}
                />
              </label>
              {totals.difference !== null && (
                <p
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    Math.abs(totals.difference) < 1
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-rose-50 text-rose-800"
                  }`}
                >
                  {Math.abs(totals.difference) < 1
                    ? "Matches the bill's total."
                    : `Differs from the bill by ${money(Math.abs(totals.difference))}. Check quantities, rates, GST % or round off.`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseEditor;
