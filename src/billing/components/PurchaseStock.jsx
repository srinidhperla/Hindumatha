import React, { useMemo, useState } from "react";
import { EmptyState } from "@/admin/components/ui/AdminUi";
import { ActionButton } from "@/shared/ui/Primitives";
import { SearchInput } from "@/shared/workspace/Toolbar";
import { billingAPI, billingError } from "@/services/billingAPI";
import SellOptionsEditor from "@/billing/components/SellOptionsEditor";
import {
  downloadCsv,
  formatDateKey,
  inputClass,
  money,
  tableCellClass,
  tableHeadClass,
} from "@/billing/billingShared";
import { round, shortBase, stockLabel } from "@/billing/stockUnits";

/* Stock — every product bought on a purchase bill, one row each. A second
 * bill for the same product adds to its row. Stock is counted in the item's
 * stock unit (pcs, kg or litre); packs (Box = 24 pcs) convert into it.
 * Selling options (1 pc ₹45, 250 g ₹60) can be set here or on the bill. */

const FILTERS = [
  { value: "all", label: "All" },
  { value: "missing", label: "No MRP / selling price" },
  { value: "out", label: "Out of stock" },
];

const perBaseLabel = (baseUnit) => (baseUnit === "pcs" ? "pc" : shortBase(baseUnit));

const toFormOptions = (options = []) =>
  options.map((option) => ({ qty: option.qty, label: option.label, price: String(option.price) }));

const StockRow = ({ item, categoryName, categories, onSave }) => {
  const [options, setOptions] = useState(() => toFormOptions(item.sellOptions));
  const [mrp, setMrp] = useState(item.mrp ?? "");
  const dirty =
    JSON.stringify(options) !== JSON.stringify(toFormOptions(item.sellOptions)) ||
    String(mrp) !== String(item.mrp ?? "");

  return (
    <tr className="align-top">
      <td className={`${tableCellClass} font-semibold`}>
        {item.name}
        <span className="block text-[11px] font-normal text-[#8a7a5c]">
          HSN {item.hsnCode || "—"} · GST {item.gstRate}%
          {item.packUnits.length
            ? ` · ${item.packUnits.map((pack) => `${pack.name} = ${round(pack.factor, 3)} ${shortBase(item.baseUnit)}`).join(", ")}`
            : ""}
        </span>
        <select
          value={item.categoryId || ""}
          onChange={(event) => onSave(item, { categoryId: event.target.value })}
          className={`${inputClass} mt-1 !w-auto !px-2 !py-0.5 text-xs`}
          aria-label={`Category of ${item.name}`}
          title={categoryName.get(item.categoryId) || "No category"}
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </td>
      <td className={`${tableCellClass} whitespace-nowrap text-right font-bold ${item.stockQty <= 0 ? "text-[#a3271b]" : ""}`}>
        {stockLabel(item.stockQty, item.baseUnit, item.packUnits)}
      </td>
      <td className={`${tableCellClass} whitespace-nowrap text-right`}>
        {item.lastRate !== null ? `${money(item.lastRate)}/${perBaseLabel(item.baseUnit)}` : "—"}
      </td>
      <td className={`${tableCellClass} w-[96px]`}>
        <input
          type="number"
          min="0"
          step="any"
          value={mrp}
          onChange={(event) => setMrp(event.target.value)}
          placeholder="Add"
          className={`${inputClass} !px-2 !py-1 text-right text-sm ${mrp === "" ? "!border-amber-300 !bg-amber-50" : ""}`}
          aria-label={`MRP per ${perBaseLabel(item.baseUnit)}`}
        />
        <span className="mt-0.5 block text-right text-[11px] text-[#8a7a5c]">per {perBaseLabel(item.baseUnit)}</span>
      </td>
      <td className={tableCellClass}>
        <SellOptionsEditor
          compact
          baseUnit={item.baseUnit}
          packUnits={item.packUnits}
          options={options}
          pricePerBase={Number(mrp) || 0}
          onChange={setOptions}
        />
        {dirty && (
          <button
            type="button"
            onClick={() =>
              onSave(item, {
                mrp: mrp === "" ? null : Number(mrp),
                sellOptions: options
                  .filter((option) => option.price !== "")
                  .map((option) => ({ ...option, price: Number(option.price) })),
              })
            }
            className="mt-1.5 rounded-lg bg-[#1f1709] px-3 py-1 text-xs font-semibold text-[#f3dd96]"
          >
            Save prices
          </button>
        )}
      </td>
      <td className={`${tableCellClass} whitespace-nowrap text-xs text-[#7d6c4d]`}>
        {item.lastPurchasedOn ? formatDateKey(item.lastPurchasedOn) : "—"}
        <span className="block max-w-[140px] truncate">{item.lastSupplier}</span>
      </td>
    </tr>
  );
};

const PurchaseStock = ({ items, categories, onChanged, onToast }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const categoryName = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (term && !item.name.toLowerCase().includes(term)) return false;
      if (filter === "missing") return !item.mrp || !item.sellOptions.length;
      if (filter === "out") return item.stockQty <= 0;
      return true;
    });
  }, [items, search, filter]);

  const value = visible.reduce((sum, item) => sum + Math.max(0, item.stockQty) * (item.lastRate || 0), 0);

  const save = async (item, patch) => {
    try {
      await billingAPI.updateStock(item.id, patch);
      onToast(`${item.name} updated.`);
      onChanged();
    } catch (error) {
      onToast(billingError(error, "Could not update the item."), "error");
    }
  };

  const exportCsv = () =>
    downloadCsv("stock.csv", [
      ["Item", "Category", "HSN", "GST %", "Stock unit", "In stock", "Packs", "Last rate per unit", "MRP per unit", "Selling options", "Last supplier", "Last bought"],
      ...visible.map((item) => [
        item.name,
        categoryName.get(item.categoryId) || "",
        item.hsnCode,
        item.gstRate,
        item.baseUnit,
        item.stockQty,
        item.packUnits.map((pack) => `${pack.name}=${pack.factor}`).join(" "),
        item.lastRate ?? "",
        item.mrp ?? "",
        item.sellOptions.map((option) => `${option.label} ${option.price}`).join(" | "),
        item.lastSupplier,
        item.lastPurchasedOn,
      ]),
    ]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-[#f6f1e6] p-1">
          {FILTERS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => setFilter(entry.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                filter === entry.value ? "bg-white text-[#1f1709] shadow-sm" : "text-[#7d6c4d]"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-[#5c4a26]">
          {visible.length} items · stock value at last rate <strong>{money(Math.round(value))}</strong>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Search stock" />
          <ActionButton variant="secondary" onClick={exportCsv} disabled={!visible.length}>
            Export CSV
          </ActionButton>
        </div>
      </div>

      {!visible.length ? (
        <EmptyState
          message={items.length ? "No items match." : "No stock yet. Save a purchase bill and its items appear here."}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={tableHeadClass}>Item</th>
                <th className={`${tableHeadClass} text-right`}>In stock</th>
                <th className={`${tableHeadClass} text-right`}>Last rate</th>
                <th className={`${tableHeadClass} text-right`}>MRP</th>
                <th className={tableHeadClass}>Selling options</th>
                <th className={tableHeadClass}>Last bought</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <StockRow
                  key={`${item.id}-${item.mrp}-${JSON.stringify(item.sellOptions)}`}
                  item={item}
                  categoryName={categoryName}
                  categories={categories}
                  onSave={save}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PurchaseStock;
