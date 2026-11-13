import React, { useEffect, useState } from "react";
import Modal from "@/shared/ui/Modal";
import { ActionButton } from "@/shared/ui/Primitives";
import { ChipRow } from "@/shared/workspace/Toolbar";
import { billingAPI, billingError } from "@/services/billingAPI";
import SellOptionsEditor from "@/billing/components/SellOptionsEditor";
import { formatDateKey, inputClass, money } from "@/billing/billingShared";
import { round, shortBase, stockLabel } from "@/billing/stockUnits";

/* One stock item: prices and low-stock level, a stock count, and every
 * purchase, sale and count that moved its stock. */

const TABS = [
  { value: "prices", label: "Prices" },
  { value: "count", label: "Count stock" },
  { value: "history", label: "History" },
];

const REASONS = ["Counted on shelf", "Damaged", "Expired", "Used in shop", "Given free"];

const MOVE = {
  purchase: { label: "Bought", tone: "text-emerald-700" },
  sale: { label: "Sold", tone: "text-[#1f1709]" },
  count: { label: "Count", tone: "text-amber-700" },
};

const toFormOptions = (options = []) =>
  options.map((option) => ({ qty: option.qty, label: option.label, price: String(option.price) }));

const Figure = ({ label, value, tone = "" }) => (
  <div className="rounded-xl bg-[#faf6ec] px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7d6c4d]">{label}</p>
    <p className={`text-base font-bold ${tone || "text-[#1f1709]"}`}>{value}</p>
  </div>
);

const StockItemPanel = ({ item, categories, onClose, onChanged, onToast }) => {
  const [tab, setTab] = useState("prices");
  const [saving, setSaving] = useState(false);
  const unit = shortBase(item.baseUnit);
  const per = item.baseUnit === "pcs" ? "pc" : unit;

  // Prices
  const [mrp, setMrp] = useState(item.mrp ?? "");
  const [options, setOptions] = useState(() => toFormOptions(item.sellOptions));
  const [lowLevel, setLowLevel] = useState(item.reorderLevel ?? "");
  const [categoryId, setCategoryId] = useState(item.categoryId || "");

  // Count
  const [counted, setCounted] = useState("");
  const [reason, setReason] = useState(REASONS[0]);

  // History
  const [moves, setMoves] = useState(null);
  useEffect(() => {
    if (tab !== "history" || moves) return;
    billingAPI
      .stockHistory(item.id)
      .then((response) => setMoves(response.moves))
      .catch((error) => onToast(billingError(error, "Could not load the history."), "error"));
  }, [tab, moves, item.id, onToast]);

  const savePrices = async () => {
    setSaving(true);
    try {
      await billingAPI.updateStock(item.id, {
        categoryId,
        mrp: mrp === "" ? null : Number(mrp),
        reorderLevel: lowLevel === "" ? null : Number(lowLevel),
        sellOptions: options
          .filter((option) => option.price !== "")
          .map((option) => ({ ...option, price: Number(option.price) })),
      });
      onToast(`${item.name} updated.`);
      onChanged();
    } catch (error) {
      onToast(billingError(error, "Could not save."), "error");
    } finally {
      setSaving(false);
    }
  };

  const saveCount = async () => {
    setSaving(true);
    try {
      await billingAPI.adjustStock(item.id, { countedQty: Number(counted), reason });
      onToast(`${item.name}: stock set to ${counted} ${unit}.`);
      setCounted("");
      setMoves(null);
      onChanged();
    } catch (error) {
      onToast(billingError(error, "Could not save the count."), "error");
    } finally {
      setSaving(false);
    }
  };

  const diff = counted === "" ? null : round(Number(counted) - item.stockQty, 3);

  return (
    <Modal title={item.name} onClose={onClose} maxWidthClassName="max-w-3xl">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Figure
          label="In stock"
          value={stockLabel(item.stockQty, item.baseUnit, item.packUnits)}
          tone={item.stockQty < 0 ? "text-rose-700" : item.status === "low" ? "text-amber-700" : ""}
        />
        <Figure label="Bought" value={`${round(item.purchasedQty, 2)} ${unit}`} />
        <Figure label="Sold" value={`${round(item.soldQty, 2)} ${unit}`} />
        <Figure label="Value" value={money(Math.round(item.costValue))} />
      </div>

      <ChipRow options={TABS} value={tab} onChange={setTab} />

      {tab === "prices" && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="ws-eyebrow">Category</span>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={inputClass}>
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="ws-eyebrow">MRP per {per}</span>
              <input
                type="number"
                min="0"
                step="any"
                value={mrp}
                onChange={(event) => setMrp(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="ws-eyebrow">Low when at or below ({unit})</span>
              <input
                type="number"
                min="0"
                step="any"
                value={lowLevel}
                onChange={(event) => setLowLevel(event.target.value)}
                placeholder={`${round(item.lowAt, 2)} (automatic)`}
                className={inputClass}
              />
            </label>
          </div>
          <div className="rounded-xl border border-[#ebe1cb] bg-[#fffdf7] p-2.5">
            <SellOptionsEditor
              baseUnit={item.baseUnit}
              packUnits={item.packUnits}
              options={options}
              pricePerBase={Number(mrp) || 0}
              onChange={setOptions}
            />
            {item.lastRate !== null && (
              <p className="mt-2 text-xs text-[#7d6c4d]">
                Bought at {money(round(item.lastRate, 2))}/{per} before GST
                {item.gstRate ? ` (${money(round(item.lastRate * (1 + item.gstRate / 100), 2))} with ${item.gstRate}% GST)` : ""}
                {item.lastSupplier ? ` from ${item.lastSupplier}` : ""}.
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <ActionButton onClick={savePrices} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </ActionButton>
          </div>
        </div>
      )}

      {tab === "count" && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-[#5c4a26]">
            Count what is on the shelf. Stock is set to your count; the
            difference is kept in History with the reason.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="ws-eyebrow">Counted ({unit})</span>
              <input
                type="number"
                min="0"
                step="any"
                value={counted}
                onChange={(event) => setCounted(event.target.value)}
                placeholder={`now ${round(item.stockQty, 3)}`}
                className={inputClass}
                autoFocus
              />
            </label>
            <div>
              <span className="ws-eyebrow">Reason</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {REASONS.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => setReason(entry)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      reason === entry ? "bg-[#1f1709] text-[#f3dd96]" : "bg-[#f6f1e6] text-[#5c4a26]"
                    }`}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {diff !== null && (
            <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              diff === 0 ? "bg-emerald-50 text-emerald-800" : diff < 0 ? "bg-rose-50 text-rose-800" : "bg-sky-50 text-sky-900"
            }`}>
              {diff === 0
                ? "Matches the stock."
                : `${diff > 0 ? "+" : ""}${diff} ${unit} — stock goes from ${round(item.stockQty, 3)} to ${round(Number(counted), 3)}.`}
            </p>
          )}
          <div className="flex justify-end">
            <ActionButton onClick={saveCount} disabled={saving || counted === "" || Number(counted) < 0}>
              {saving ? "Saving..." : "Set stock"}
            </ActionButton>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="mt-3">
          {!moves ? (
            <p className="py-6 text-center text-sm text-[#7d6c4d]">Loading…</p>
          ) : !moves.length ? (
            <p className="py-6 text-center text-sm text-[#7d6c4d]">No movements yet.</p>
          ) : (
            <ul className="max-h-[50vh] divide-y divide-[#f3ecdb] overflow-y-auto rounded-xl border border-[#ebe1cb]">
              {moves.map((move, index) => (
                <li key={`${move.type}-${move.at}-${index}`} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-[74px] shrink-0 text-xs text-[#7d6c4d]">
                    {formatDateKey(move.dateKey, { year: undefined })}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`text-sm font-semibold ${MOVE[move.type].tone}`}>{MOVE[move.type].label}</span>
                    <span className="ml-1.5 text-sm text-[#1f1709]">{move.detail}</span>
                    {move.note && <span className="block truncate text-xs text-[#8a7a5c]">{move.note}</span>}
                  </span>
                  <span className={`shrink-0 text-sm font-bold ${move.qty < 0 ? "text-[#a3271b]" : "text-emerald-700"}`}>
                    {move.qty > 0 ? "+" : ""}
                    {round(move.qty, 3)} {unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
};

export default StockItemPanel;
