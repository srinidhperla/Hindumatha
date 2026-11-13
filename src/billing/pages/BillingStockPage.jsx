import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronRight, FiDownload } from "react-icons/fi";
import { EmptyState, LoadingState } from "@/admin/components/ui/AdminUi";
import { ActionButton } from "@/shared/ui/Primitives";
import { ChipRow, SearchInput } from "@/shared/workspace/Toolbar";
import { billingAPI, billingError } from "@/services/billingAPI";
import StockItemPanel from "@/billing/components/StockItemPanel";
import {
  downloadCsv,
  formatDateKey,
  inputClass,
  money,
  tableCellClass,
  tableHeadClass,
} from "@/billing/billingShared";
import { round, shortBase, stockLabel } from "@/billing/stockUnits";

/* Stock — the stock position of everything bought on purchase bills.
 *   Top: stock value at cost and at selling price, items low / out.
 *   Categories: value per billing category; tap one to see its items.
 *   List: each item's stock, rate, selling price, margin and value; tap a
 *   row for prices, a stock count, and its purchase/sale history. */

const STATUS = {
  ok: { label: "In stock", tone: "bg-emerald-50 text-emerald-800" },
  low: { label: "Low", tone: "bg-amber-50 text-amber-800" },
  out: { label: "Out", tone: "bg-rose-50 text-rose-700" },
  negative: { label: "Below zero", tone: "bg-rose-100 text-rose-800" },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "ok", label: "In stock" },
  { value: "low", label: "Low" },
  { value: "out", label: "Out" },
  { value: "negative", label: "Below zero" },
  { value: "noprice", label: "No selling price" },
];

const SORTS = [
  { value: "name", label: "Name" },
  { value: "value", label: "Stock value" },
  { value: "low", label: "Lowest stock first" },
  { value: "recent", label: "Recently bought" },
];

const perUnit = (baseUnit) => (baseUnit === "pcs" ? "pc" : shortBase(baseUnit));
const NO_CATEGORY = "none";

const StatusChip = ({ status }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS[status].tone}`}>
    {STATUS[status].label}
  </span>
);

const BillingStockPage = ({ onToast }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [openId, setOpenId] = useState("");

  const load = useCallback(async () => {
    try {
      const [stock, categoryResponse] = await Promise.all([
        billingAPI.listStock(),
        billingAPI.listCategories(),
      ]);
      setItems(stock.items);
      setCategories(categoryResponse.categories);
    } catch (error) {
      onToast(billingError(error, "Could not load stock."), "error");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryName = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  // Totals for the whole stock, and per category.
  const summary = useMemo(() => {
    const byCategory = new Map();
    const totals = { items: items.length, cost: 0, sell: 0, low: 0, out: 0, negative: 0 };
    items.forEach((item) => {
      totals.cost += item.costValue;
      totals.sell += item.sellValue;
      if (item.status === "low") totals.low += 1;
      if (item.status === "out") totals.out += 1;
      if (item.status === "negative") totals.negative += 1;
      const key = item.categoryId || NO_CATEGORY;
      const entry = byCategory.get(key) || { id: key, items: 0, cost: 0, sell: 0, low: 0 };
      entry.items += 1;
      entry.cost += item.costValue;
      entry.sell += item.sellValue;
      if (item.status !== "ok") entry.low += 1;
      byCategory.set(key, entry);
    });
    const categoryRows = [...byCategory.values()]
      .map((entry) => ({
        ...entry,
        name: entry.id === NO_CATEGORY ? "No category" : categoryName.get(entry.id) || "Unknown",
      }))
      .sort((a, b) => b.cost - a.cost);
    return { ...totals, categoryRows };
  }, [items, categoryName]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = items.filter((item) => {
      if (term && !item.name.toLowerCase().includes(term)) return false;
      if (categoryId && (item.categoryId || NO_CATEGORY) !== categoryId) return false;
      if (filter === "noprice") return !item.sellOptions.length;
      if (filter !== "all") return item.status === filter;
      return true;
    });
    const order = { negative: 0, out: 1, low: 2, ok: 3 };
    return list.sort((a, b) => {
      if (sort === "value") return b.costValue - a.costValue;
      if (sort === "low") return order[a.status] - order[b.status] || a.stockQty - b.stockQty;
      if (sort === "recent") return String(b.lastPurchasedOn).localeCompare(String(a.lastPurchasedOn));
      return a.name.localeCompare(b.name);
    });
  }, [items, search, categoryId, filter, sort]);

  const visibleCost = visible.reduce((sum, item) => sum + item.costValue, 0);
  const visibleSell = visible.reduce((sum, item) => sum + item.sellValue, 0);
  const maxCategoryCost = Math.max(1, ...summary.categoryRows.map((entry) => entry.cost));

  const exportCsv = () =>
    downloadCsv("stock-position.csv", [
      ["Item", "Category", "HSN", "GST %", "Unit", "In stock", "Bought", "Sold", "Counted ±", "Low at", "Status", "Last rate", "Sell price", "Margin %", "Value at cost", "Value at selling", "Last supplier", "Last bought"],
      ...visible.map((item) => [
        item.name,
        categoryName.get(item.categoryId) || "",
        item.hsnCode,
        item.gstRate,
        item.baseUnit,
        item.stockQty,
        item.purchasedQty,
        item.soldQty,
        item.adjustedQty,
        item.lowAt,
        STATUS[item.status].label,
        item.lastRate ?? "",
        item.sellPerBase ?? "",
        item.marginPercent ?? "",
        item.costValue,
        item.sellValue,
        item.lastSupplier,
        item.lastPurchasedOn,
      ]),
    ]);

  if (loading) return <LoadingState />;

  if (!items.length) {
    return (
      <EmptyState message="No stock yet. Items appear here when you save a purchase bill (Purchases)." />
    );
  }

  const openItem = items.find((item) => item.id === openId) || null;

  return (
    <div className="space-y-3">
      {/* Stock position */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="ws-card px-3.5 py-3">
          <p className="ws-eyebrow">Stock value</p>
          <p className="mt-0.5 text-2xl font-bold text-[#1f1709]">{money(Math.round(summary.cost))}</p>
          <p className="text-xs text-[#7d6c4d]">at purchase rate</p>
        </div>
        <div className="ws-card px-3.5 py-3">
          <p className="ws-eyebrow">At selling price</p>
          <p className="mt-0.5 text-2xl font-bold text-[#1f1709]">{money(Math.round(summary.sell))}</p>
          <p className="text-xs text-[#7d6c4d]">
            {summary.sell > summary.cost ? `${money(Math.round(summary.sell - summary.cost))} over cost` : "set selling prices"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFilter("low")}
          className="ws-card px-3.5 py-3 text-left hover:border-amber-300"
        >
          <p className="ws-eyebrow">Low stock</p>
          <p className="mt-0.5 text-2xl font-bold text-amber-700">{summary.low}</p>
          <p className="text-xs text-[#7d6c4d]">of {summary.items} items · tap to see</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter(summary.negative ? "negative" : "out")}
          className="ws-card px-3.5 py-3 text-left hover:border-rose-300"
        >
          <p className="ws-eyebrow">Out of stock</p>
          <p className="mt-0.5 text-2xl font-bold text-rose-700">{summary.out + summary.negative}</p>
          <p className="text-xs text-[#7d6c4d]">
            {summary.negative ? `${summary.negative} below zero` : "tap to see"}
          </p>
        </button>
      </div>

      {/* Category-wise */}
      <div className="ws-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1f1709]">By category</h2>
          {categoryId && (
            <button type="button" onClick={() => setCategoryId("")} className="text-xs font-semibold text-[#8b6914] hover:underline">
              Show all categories
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {summary.categoryRows.map((entry) => {
            const active = categoryId === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setCategoryId(active ? "" : entry.id)}
                className={`rounded-xl border px-3 py-2 text-left admin-motion ${
                  active ? "border-[#1f1709] bg-[#1f1709] text-white" : "border-[#ebe1cb] bg-white hover:border-[#c9a84c]"
                }`}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{entry.name}</span>
                  <span className={`shrink-0 text-[11px] ${active ? "text-[#f3dd96]" : "text-[#8a7a5c]"}`}>
                    {entry.items} item{entry.items === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="mt-0.5 block text-base font-bold">{money(Math.round(entry.cost))}</span>
                <span className={`block text-[11px] ${active ? "text-[#f3dd96]" : "text-[#7d6c4d]"}`}>
                  sells for {money(Math.round(entry.sell))}
                  {entry.low ? ` · ${entry.low} low/out` : ""}
                </span>
                <span className={`mt-1.5 block h-1.5 rounded-full ${active ? "bg-white/25" : "bg-[#f3ecdb]"}`}>
                  <span
                    className={`block h-1.5 rounded-full ${active ? "bg-[#f3dd96]" : "bg-[#c9a84c]"}`}
                    style={{ width: `${Math.max(3, (entry.cost / maxCategoryCost) * 100)}%` }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items */}
      <div className="ws-card p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ChipRow options={FILTERS} value={filter} onChange={setFilter} />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search stock" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className={`${inputClass} !w-auto !py-1.5 text-sm`}
              aria-label="Sort"
            >
              {SORTS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
            <ActionButton variant="secondary" onClick={exportCsv} className="!px-3 !py-1.5" title="Export CSV">
              <FiDownload />
            </ActionButton>
          </div>
        </div>

        {!visible.length ? (
          <EmptyState message="No items match." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={tableHeadClass}>Item</th>
                  <th className={`${tableHeadClass} hidden lg:table-cell`}>Category</th>
                  <th className={`${tableHeadClass} text-right`}>In stock</th>
                  <th className={`${tableHeadClass} hidden text-right md:table-cell`}>Rate</th>
                  <th className={`${tableHeadClass} text-right`}>Sells at</th>
                  <th className={`${tableHeadClass} hidden text-right lg:table-cell`}>Margin</th>
                  <th className={`${tableHeadClass} text-right`}>Value</th>
                  <th className={tableHeadClass}>Status</th>
                  <th className={`${tableHeadClass} w-6`} />
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setOpenId(item.id)}
                    className="cursor-pointer hover:bg-[#fffaf0]"
                  >
                    <td className={`${tableCellClass} !py-2`}>
                      <span className="block font-semibold leading-5">{item.name}</span>
                      <span className="block truncate text-[11px] text-[#8a7a5c]">
                        <span className="lg:hidden">{categoryName.get(item.categoryId) || "No category"} · </span>
                        {item.gstRate}% GST
                        <span className="hidden xl:inline">
                          {" "}· HSN {item.hsnCode || "—"}
                          {item.lastPurchasedOn ? ` · bought ${formatDateKey(item.lastPurchasedOn, { year: undefined })}` : ""}
                        </span>
                      </span>
                    </td>
                    <td className={`${tableCellClass} hidden !py-2 text-sm lg:table-cell`}>
                      {categoryName.get(item.categoryId) || <span className="text-[#a8936a]">None</span>}
                    </td>
                    <td className={`${tableCellClass} whitespace-nowrap !py-2 text-right font-bold ${item.stockQty < 0 ? "text-rose-700" : ""}`}>
                      {stockLabel(item.stockQty, item.baseUnit, item.packUnits)}
                      <span className="block text-[11px] font-normal text-[#8a7a5c]">
                        low at {round(item.lowAt, 2)}
                      </span>
                    </td>
                    <td className={`${tableCellClass} hidden whitespace-nowrap !py-2 text-right text-sm md:table-cell`}>
                      {item.lastRate !== null ? `${money(round(item.lastRate, 2))}/${perUnit(item.baseUnit)}` : "—"}
                    </td>
                    <td className={`${tableCellClass} whitespace-nowrap !py-2 text-right text-sm`}>
                      {item.sellPerBase !== null ? (
                        `${money(item.sellPerBase)}/${perUnit(item.baseUnit)}`
                      ) : (
                        <span className="font-semibold text-amber-700">Set price</span>
                      )}
                    </td>
                    <td className={`${tableCellClass} hidden !py-2 text-right text-sm lg:table-cell ${
                      item.marginPercent !== null && item.marginPercent < 5 ? "text-rose-700" : ""
                    }`}>
                      {item.marginPercent !== null ? `${round(item.marginPercent, 1)}%` : "—"}
                    </td>
                    <td className={`${tableCellClass} whitespace-nowrap !py-2 text-right font-semibold`}>
                      {money(Math.round(item.costValue))}
                    </td>
                    <td className={`${tableCellClass} !py-2`}>
                      <StatusChip status={item.status} />
                    </td>
                    <td className={`${tableCellClass} !py-2 text-[#a8936a]`}>
                      <FiChevronRight />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-3 pt-2.5 text-sm font-semibold text-[#5c4a26]">
                    {visible.length} item{visible.length === 1 ? "" : "s"}
                  </td>
                  <td className="hidden lg:table-cell" />
                  <td />
                  <td className="hidden md:table-cell" />
                  <td className="px-3 pt-2.5 text-right text-xs text-[#7d6c4d]">sells for {money(Math.round(visibleSell))}</td>
                  <td className="hidden lg:table-cell" />
                  <td className="px-3 pt-2.5 text-right text-sm font-bold text-[#1f1709]">{money(Math.round(visibleCost))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {openItem && (
        <StockItemPanel
          item={openItem}
          categories={categories}
          onClose={() => setOpenId("")}
          onChanged={load}
          onToast={onToast}
        />
      )}
    </div>
  );
};

export default BillingStockPage;
