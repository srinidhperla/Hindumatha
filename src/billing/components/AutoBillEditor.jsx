import React, { useMemo, useState } from "react";
import Modal from "@/shared/ui/Modal";
import { ActionButton } from "@/shared/ui/Primitives";
import { FormField, fieldClass } from "@/shared/workspace/Form";
import { SearchInput } from "@/shared/workspace/Toolbar";
import { ModeChip, formatClock, money } from "@/billing/billingShared";

/* Edit one generated bill before saving: change quantities, remove lines,
 * add catalog items, category amounts, or an item typed in by hand (for when
 * you know what was really sold).
 *
 * A PhonePe bill's amount is what the customer paid and is locked; the items
 * must add up to it. A cash bill's amount can be changed, which moves the
 * day's cash total — the review screen shows that difference. */

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const lineKey = (line) =>
  line.productId
    ? `item|${line.productId}|${line.variantKey}`
    : `${line.open ? "open" : "value"}|${line.categoryId}|${line.name}|${line.unitPrice}`;

const AutoBillEditor = ({ bill, catalog, onSave, onClose }) => {
  const [lines, setLines] = useState(() =>
    bill.lines.map((line) => ({ ...line, key: lineKey(line) })),
  );
  const [amount, setAmount] = useState(bill.amount);
  const [search, setSearch] = useState("");
  const [pickVariant, setPickVariant] = useState(null);
  const [own, setOwn] = useState({ name: "", price: "", categoryId: "" });
  const isPhonePe = bill.mode === "phonepe";

  const categories = catalog.billingCategories || [];
  const valueCategories = categories.filter((entry) => entry.isValueCategory);
  const term = search.trim().toLowerCase();

  const results = useMemo(() => {
    if (!term) return [];
    const items = catalog.items
      .filter((item) => item.billable && item.name.toLowerCase().includes(term))
      .slice(0, 8)
      .map((item) => ({ type: "item", item }));
    const values = valueCategories
      .filter((entry) => entry.name.toLowerCase().includes(term))
      .map((entry) => ({ type: "value", entry }));
    return [...values, ...items];
  }, [catalog.items, valueCategories, term]);

  const itemsTotal = round2(
    lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
  );
  const target = round2(amount);
  const difference = round2(target - itemsTotal);
  const matches = Math.abs(difference) < 0.005 && itemsTotal > 0;

  const addLine = (line) => {
    const key = lineKey(line);
    setLines((current) => {
      const existing = current.find((entry) => entry.key === key);
      if (existing) {
        return current.map((entry) =>
          entry.key === key ? { ...entry, qty: entry.qty + 1 } : entry,
        );
      }
      return [...current, { ...line, key, qty: 1 }];
    });
    setSearch("");
    setPickVariant(null);
  };

  const addItem = (item, variant) =>
    addLine({
      productId: item.id,
      variantKey: variant.key,
      categoryId: item.billingCategoryId || "",
      name: item.name,
      variant: variant.label,
      unitPrice: variant.price,
      open: false,
    });

  const addValue = (entry, price) =>
    addLine({
      productId: "",
      variantKey: "",
      categoryId: entry.id,
      name: entry.name,
      variant: "",
      unitPrice: price,
      open: false,
    });

  const addOwn = (event) => {
    event.preventDefault();
    const price = round2(own.price);
    const category = categories.find((entry) => entry.id === own.categoryId);
    if (!category || !(price > 0)) return;
    addLine({
      productId: "",
      variantKey: "",
      categoryId: category.id,
      name: own.name.trim() || category.name,
      variant: "",
      unitPrice: price,
      open: true,
    });
    setOwn({ name: "", price: "", categoryId: own.categoryId });
  };

  const setQty = (key, qty) =>
    setLines((current) =>
      qty <= 0
        ? current.filter((entry) => entry.key !== key)
        : current.map((entry) =>
            entry.key === key ? { ...entry, qty } : entry,
          ),
    );

  const fillDifference = () => {
    // Puts the missing amount on a hand-typed line in the chosen category.
    const category = categories.find((entry) => entry.id === own.categoryId);
    if (!category || difference <= 0) return;
    addLine({
      productId: "",
      variantKey: "",
      categoryId: category.id,
      name: own.name.trim() || category.name,
      variant: "",
      unitPrice: difference,
      open: true,
    });
  };

  const save = () =>
    onSave({
      ...bill,
      amount: target,
      lines: lines.map((line) => {
        const saved = { ...line, lineTotal: round2(line.qty * line.unitPrice) };
        delete saved.key;
        return saved;
      }),
      itemsTotal,
      needsFix: false,
      shortBy: 0,
      edited: true,
    });

  return (
    <Modal
      title="Edit bill"
      badge={
        <span className="flex items-center gap-2 text-sm text-[#7d6c4d]">
          <ModeChip mode={bill.mode} /> {formatClock(bill.time)}
          {bill.reference ? ` · ${bill.reference}` : ""}
        </span>
      }
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className={`text-sm font-semibold ${
              matches ? "text-emerald-700" : "text-[#a3271b]"
            }`}
          >
            {matches
              ? "Items match the amount"
              : difference > 0
                ? `Items are ${money(difference)} short`
                : `Items are ${money(-difference)} over`}
          </p>
          <div className="flex gap-2">
            <ActionButton variant="secondary" onClick={onClose}>
              Cancel
            </ActionButton>
            <ActionButton onClick={save} disabled={!matches}>
              Save bill
            </ActionButton>
          </div>
        </div>
      }
    >
      <div className="ws-form">
        <div className="flex flex-wrap items-end gap-4">
          <FormField
            label={
              isPhonePe ? "Amount paid (PhonePe — locked)" : "Cash amount (₹)"
            }
            className="w-48"
          >
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={isPhonePe}
              className={fieldClass}
            />
          </FormField>
          {!isPhonePe && !matches && itemsTotal > 0 && (
            <button
              type="button"
              onClick={() => setAmount(itemsTotal)}
              className="pb-2.5 text-xs font-semibold text-[#8b6914] hover:underline"
            >
              Set amount to items total ({money(itemsTotal)})
            </button>
          )}
          <p className="ml-auto pb-2 text-sm text-[#7d6c4d]">
            Items total{" "}
            <strong className="text-[#1f1709]">{money(itemsTotal)}</strong>
          </p>
        </div>

        <div>
          {lines.length ? (
            <ul className="divide-y divide-[#f3ecdb] rounded-xl border border-[#ebe1cb]">
              {lines.map((line) => (
                <li
                  key={line.key}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1f1709]">
                      {line.name}
                      {line.variant && (
                        <span className="font-normal text-[#7d6c4d]">
                          {" "}
                          · {line.variant}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[#7d6c4d]">
                      {money(line.unitPrice)}
                      {line.open ? " · typed in" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQty(line.key, line.qty - 1)}
                    className="h-8 w-8 rounded-lg border border-[#e3d7bb] bg-white font-bold text-[#5c4a26] hover:bg-[#faf6ec]"
                    aria-label={`Reduce ${line.name}`}
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm font-semibold">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(line.key, line.qty + 1)}
                    className="h-8 w-8 rounded-lg border border-[#e3d7bb] bg-white font-bold text-[#5c4a26] hover:bg-[#faf6ec]"
                    aria-label={`Add ${line.name}`}
                  >
                    +
                  </button>
                  <span className="w-20 text-right text-sm font-semibold">
                    {money(line.qty * line.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-[#e3d7bb] px-4 py-6 text-center text-sm text-[#7d6c4d]">
              No items yet. Add them below.
            </p>
          )}
        </div>

        <div>
          <p className="ws-eyebrow mb-2">Add from your items</p>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search items or categories"
          />
          {results.length > 0 && (
            <div className="mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-[#ebe1cb]">
              {results.map((result) =>
                result.type === "item" ? (
                  <button
                    type="button"
                    key={result.item.id}
                    onClick={() =>
                      result.item.variants.length > 1
                        ? setPickVariant(result.item)
                        : addItem(result.item, result.item.variants[0])
                    }
                    className="flex w-full items-center justify-between border-b border-[#f3ecdb] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-[#faf6ec]"
                  >
                    <span className="text-[#1f1709]">{result.item.name}</span>
                    <span className="text-xs font-semibold text-[#8b6914]">
                      {result.item.variants.length > 1
                        ? `${result.item.variants.length} sizes`
                        : money(result.item.variants[0].price)}
                    </span>
                  </button>
                ) : (
                  <div
                    key={result.entry.id}
                    className="flex flex-wrap items-center gap-1.5 border-b border-[#f3ecdb] px-3 py-2 last:border-b-0"
                  >
                    <span className="mr-2 text-sm text-[#1f1709]">
                      {result.entry.name}
                    </span>
                    {result.entry.allowedValues.slice(0, 12).map((value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => addValue(result.entry, value)}
                        className="rounded-full border border-[#e3d7bb] px-2.5 py-0.5 text-xs font-semibold text-[#5c4a26] hover:bg-[#faf6ec]"
                      >
                        {money(value)}
                      </button>
                    ))}
                  </div>
                ),
              )}
            </div>
          )}
          {pickVariant && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl bg-[#faf6ec] px-3 py-2">
              <span className="mr-2 text-sm font-semibold text-[#1f1709]">
                {pickVariant.name}
              </span>
              {pickVariant.variants.map((variant) => (
                <button
                  type="button"
                  key={variant.key}
                  onClick={() => addItem(pickVariant, variant)}
                  className="rounded-full border border-[#e3d7bb] bg-white px-2.5 py-0.5 text-xs font-semibold text-[#5c4a26] hover:border-[#c9a84c]"
                >
                  {variant.label} · {money(variant.price)}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={addOwn}>
          <p className="ws-eyebrow mb-2">Type in what was really sold</p>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_90px_auto]">
            <input
              value={own.name}
              onChange={(event) => setOwn({ ...own, name: event.target.value })}
              placeholder="Item name (optional)"
              className={fieldClass}
              maxLength={120}
            />
            <select
              value={own.categoryId}
              onChange={(event) =>
                setOwn({ ...own, categoryId: event.target.value })
              }
              className={fieldClass}
              aria-label="Category"
            >
              <option value="">Category…</option>
              {categories.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} ({entry.gstRate}%)
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={own.price}
              onChange={(event) =>
                setOwn({ ...own, price: event.target.value })
              }
              placeholder="₹"
              className={fieldClass}
              aria-label="Price"
            />
            <ActionButton
              type="submit"
              variant="secondary"
              disabled={!own.categoryId || !(Number(own.price) > 0)}
            >
              Add
            </ActionButton>
          </div>
          {difference > 0 && own.categoryId && (
            <button
              type="button"
              onClick={fillDifference}
              className="mt-2 text-xs font-semibold text-[#8b6914] hover:underline"
            >
              Add the missing {money(difference)} as this item
            </button>
          )}
        </form>
      </div>
    </Modal>
  );
};

export default AutoBillEditor;
