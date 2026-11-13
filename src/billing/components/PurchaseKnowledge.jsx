import React, { useCallback, useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { EmptyState } from "@/admin/components/ui/AdminUi";
import { ActionButton } from "@/shared/ui/Primitives";
import { SearchInput } from "@/shared/workspace/Toolbar";
import { billingAPI, billingError } from "@/services/billingAPI";
import {
  inputClass,
  money,
  tableCellClass,
  tableHeadClass,
} from "@/billing/billingShared";

/* What the bill reader knows beyond the bill itself.
 *   Short names — abbreviations on supplier bills (CDM = Cadbury Dairy
 *                 Milk), for every supplier or one. Sent with every bill.
 *   Learned items — every line of every saved bill: how the supplier prints
 *                 it and what it really is. The next bill uses these first,
 *                 so a correction made once sticks. */

const cellInput = `${inputClass} !px-2 !py-1 text-sm`;

const PurchaseKnowledge = ({ categories, onToast }) => {
  const [shortNames, setShortNames] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState({ short: "", full: "", supplierName: "" });

  const loadShortNames = useCallback(async () => {
    try {
      setShortNames((await billingAPI.listShortNames()).shortNames);
    } catch (error) {
      onToast(billingError(error, "Could not load short names."), "error");
    }
  }, [onToast]);

  const loadItems = useCallback(async () => {
    try {
      setItems((await billingAPI.listLearnedItems({ q: search.trim() || undefined })).items);
    } catch (error) {
      onToast(billingError(error, "Could not load learned items."), "error");
    }
  }, [search, onToast]);

  useEffect(() => {
    loadShortNames();
  }, [loadShortNames]);

  useEffect(() => {
    const timer = window.setTimeout(loadItems, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [loadItems, search]);

  const addShortName = async (event) => {
    event.preventDefault();
    try {
      await billingAPI.saveShortName(draft);
      setDraft({ short: "", full: "", supplierName: "" });
      loadShortNames();
    } catch (error) {
      onToast(billingError(error, "Could not save the short name."), "error");
    }
  };

  const removeShortName = async (entry) => {
    try {
      await billingAPI.deleteShortName(entry.id);
      setShortNames((current) => current.filter((item) => item.id !== entry.id));
    } catch (error) {
      onToast(billingError(error, "Could not delete the short name."), "error");
    }
  };

  const updateItem = async (item, patch) => {
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, ...patch } : entry)),
    );
    try {
      await billingAPI.updateLearnedItem(item.id, patch);
    } catch (error) {
      onToast(billingError(error, "Could not update the item."), "error");
      loadItems();
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Forget "${item.printedName}"? The next bill will be read without it.`)) return;
    try {
      await billingAPI.deleteLearnedItem(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      onToast(billingError(error, "Could not delete the item."), "error");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,2fr)_5fr]">
      <section>
        <h3 className="text-sm font-bold text-[#1f1709]">Short names on bills</h3>
        <p className="mb-2 text-xs text-[#7d6c4d]">
          Given to the AI with every bill. Leave the supplier empty to use it
          for all suppliers.
        </p>
        <form onSubmit={addShortName} className="mb-3 grid grid-cols-[80px_1fr] gap-2">
          <input
            value={draft.short}
            onChange={(event) => setDraft((current) => ({ ...current, short: event.target.value }))}
            placeholder="CDM"
            className={cellInput}
            aria-label="Short form"
          />
          <input
            value={draft.full}
            onChange={(event) => setDraft((current) => ({ ...current, full: event.target.value }))}
            placeholder="Cadbury Dairy Milk"
            className={cellInput}
            aria-label="Full name"
          />
          <input
            value={draft.supplierName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, supplierName: event.target.value }))
            }
            placeholder="Only for supplier (optional)"
            className={`${cellInput} col-span-2`}
            aria-label="Supplier"
          />
          <ActionButton type="submit" className="col-span-2 !py-2" disabled={!draft.short || !draft.full}>
            Add short name
          </ActionButton>
        </form>
        <ul className="divide-y divide-[#f3ecdb] rounded-xl border border-[#ebe1cb]">
          {shortNames.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <strong className="min-w-[56px] text-[#1f1709]">{entry.short}</strong>
              <span className="flex-1 text-[#4a3610]">
                {entry.full}
                {entry.supplierName && (
                  <span className="block text-xs text-[#8a7a5c]">only {entry.supplierName}</span>
                )}
              </span>
              <button
                type="button"
                aria-label={`Delete ${entry.short}`}
                onClick={() => removeShortName(entry)}
                className="rounded-lg p-1.5 text-[#a3271b] hover:bg-rose-50"
              >
                <FiTrash2 />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="min-w-0">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#1f1709]">
              Items learned from your bills ({items.length})
            </h3>
            <p className="text-xs text-[#7d6c4d]">
              Saved from every bill you save. Fix one here and the next bill
              uses it.
            </p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search items" />
        </div>
        {!items.length ? (
          <EmptyState message="Nothing learned yet. Save a purchase bill and its items appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className={tableHeadClass}>On the bill</th>
                  <th className={tableHeadClass}>Is really</th>
                  <th className={tableHeadClass}>Category</th>
                  <th className={tableHeadClass}>Pack</th>
                  <th className={`${tableHeadClass} text-right`}>Last rate</th>
                  <th className={tableHeadClass} />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className={`${tableCellClass} max-w-[220px]`}>
                      <span className="block truncate font-mono text-xs">{item.printedName}</span>
                      <span className="block truncate text-[11px] text-[#8a7a5c]">
                        {item.supplierName} · used {item.uses}×
                      </span>
                    </td>
                    <td className={tableCellClass}>
                      <input
                        defaultValue={item.name}
                        onBlur={(event) => {
                          const name = event.target.value.trim();
                          if (name && name !== item.name) updateItem(item, { name });
                        }}
                        className={cellInput}
                      />
                    </td>
                    <td className={tableCellClass}>
                      <select
                        value={item.categoryId || ""}
                        onChange={(event) => updateItem(item, { categoryId: event.target.value })}
                        className={cellInput}
                      >
                        <option value="">None</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className={`${tableCellClass} w-[84px]`}>
                      <input
                        type="number"
                        min="1"
                        defaultValue={item.packSize ?? ""}
                        placeholder="—"
                        onBlur={(event) => {
                          const value = event.target.value === "" ? null : Number(event.target.value);
                          if (value !== item.packSize) updateItem(item, { packSize: value });
                        }}
                        className={`${cellInput} text-right`}
                        title="Pieces in one unit (box of 24 → 24)"
                      />
                    </td>
                    <td className={`${tableCellClass} text-right`}>
                      {item.lastRate !== null ? money(item.lastRate) : "—"}
                    </td>
                    <td className={`${tableCellClass} text-right`}>
                      <button
                        type="button"
                        aria-label={`Forget ${item.printedName}`}
                        onClick={() => removeItem(item)}
                        className="rounded-lg p-1.5 text-[#a3271b] hover:bg-rose-50"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default PurchaseKnowledge;
