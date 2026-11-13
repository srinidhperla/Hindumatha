import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  LoadingState,
  MetricCard,
} from "@/admin/components/ui/AdminUi";
import { ActionButton, StatusChip, Toggle } from "@/shared/ui/Primitives";
import Modal from "@/shared/ui/Modal";
import { billingAPI, billingError } from "@/services/billingAPI";
import { optimizeCloudinaryUploadUrl } from "@/utils/imageOptimization";
import {
  Field,
  Panel,
  inputClass,
  money,
  tableCellClass,
  tableHeadClass,
  titleCase,
} from "@/billing/billingShared";

const emptyItem = { name: "", category: "", price: "", gstRate: 5 };

const BillingItemsPage = ({ onToast, canManage }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [show, setShow] = useState("all");
  const [savingId, setSavingId] = useState("");
  const [priceEdit, setPriceEdit] = useState(null);
  const [newItem, setNewItem] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await billingAPI.getCatalog();
      // Website products only; stock items are managed under Purchases.
      setItems(response.items.filter((item) => item.kind !== "stock"));
    } catch (error) {
      onToast(billingError(error, "Could not load items."), "error");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category))].sort(),
    [items],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (!category || item.category === category) &&
        (!term || item.name.toLowerCase().includes(term)) &&
        (show === "all" ||
          (show === "billing" && item.billable) ||
          (show === "hidden" && !item.billable) ||
          (show === "shop" && !item.showOnWebsite)),
    );
  }, [items, category, search, show]);

  const replaceItem = (item) =>
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? item : entry)),
    );

  const updateItem = async (item, payload, message) => {
    setSavingId(item.id);
    try {
      const response = await billingAPI.updateItem(item.id, payload);
      replaceItem(response.item);
      onToast(message);
      return true;
    } catch (error) {
      onToast(billingError(error, "Could not update the item."), "error");
      return false;
    } finally {
      setSavingId("");
    }
  };

  const savePrice = async (event) => {
    event.preventDefault();
    const saved = await updateItem(
      priceEdit.item,
      { price: Number(priceEdit.price), gstRate: Number(priceEdit.gstRate) },
      `${priceEdit.item.name} updated.`,
    );
    if (saved) setPriceEdit(null);
  };

  const createItem = async (event) => {
    event.preventDefault();
    setSavingId("new");
    try {
      const response = await billingAPI.createItem({
        ...newItem,
        price: Number(newItem.price),
        gstRate: Number(newItem.gstRate),
      });
      setItems((current) => [...current, response.item]);
      setNewItem(null);
      onToast(`${response.item.name} added to billing.`);
    } catch (error) {
      onToast(billingError(error, "Could not add the item."), "error");
    } finally {
      setSavingId("");
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const billableCount = items.filter((item) => item.billable).length;
  const shopOnlyCount = items.filter((item) => !item.showOnWebsite).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          highlight
          title="Items in billing"
          value={billableCount}
          subtitle={`of ${items.length} items in the catalog`}
        />
        <MetricCard
          title="Categories"
          value={categories.length}
          subtitle="Shared with the website menu"
        />
        <MetricCard
          title="Shop-only items"
          value={shopOnlyCount}
          subtitle="Sold at the counter, not on the website"
        />
      </div>

      <Panel
        title="Billing items"
        action={
          canManage && (
            <ActionButton onClick={() => setNewItem({ ...emptyItem })}>
              + Add shop item
            </ActionButton>
          )
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search items..."
            className={inputClass}
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputClass}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {titleCase(entry)}
              </option>
            ))}
          </select>
          <select
            value={show}
            onChange={(event) => setShow(event.target.value)}
            className={inputClass}
            aria-label="Show"
          >
            <option value="all">All items</option>
            <option value="billing">In billing</option>
            <option value="hidden">Not in billing</option>
            <option value="shop">Shop-only</option>
          </select>
        </div>

        <div className="mt-4">
          {visible.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className={tableHeadClass}>Item</th>
                    <th className={tableHeadClass}>Billing category</th>
                    <th className={tableHeadClass}>Price</th>
                    <th className={`${tableHeadClass} text-right`}>GST</th>
                    <th className={tableHeadClass}>Website</th>
                    <th className={tableHeadClass}>In billing</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr
                      key={item.id}
                      className={item.billable ? "" : "opacity-60"}
                    >
                      <td className={tableCellClass}>
                        <div className="flex items-center gap-3">
                          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#f8eed2]">
                            {item.image && (
                              <img
                                src={optimizeCloudinaryUploadUrl(
                                  item.image,
                                  "f_auto,q_auto,w_96",
                                )}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </span>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                      </td>
                      <td className={tableCellClass}>
                        {item.billingCategory ? (
                          <>
                            {item.billingCategory}
                            <span className="block text-xs text-[#8a7a5c]">
                              HSN {item.hsnCode || "—"}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#a3271b]">Not set</span>
                        )}
                      </td>
                      <td className={tableCellClass}>
                        {item.hasVariants ? (
                          <div className="flex flex-wrap gap-1">
                            {item.variants.map((variant) => (
                              <span
                                key={variant.key}
                                className="rounded-lg bg-[#f6f1e6] px-2 py-0.5 text-xs text-[#4a3610]"
                              >
                                {variant.label} · {money(variant.price)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="font-semibold">
                            {money(item.price)}
                            {canManage && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPriceEdit({
                                    item,
                                    price: item.price,
                                    gstRate: item.gstRate,
                                  })
                                }
                                className="ml-2 text-xs font-semibold text-[#8b6914] hover:underline"
                              >
                                Edit
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                      <td
                        className={`${tableCellClass} text-right text-[#7d6c4d]`}
                      >
                        {item.gstRate}%
                      </td>
                      <td className={tableCellClass}>
                        <StatusChip
                          tone={item.showOnWebsite ? "success" : "neutral"}
                        >
                          {item.showOnWebsite ? "On website" : "Shop only"}
                        </StatusChip>
                      </td>
                      <td className={tableCellClass}>
                        <Toggle
                          checked={item.billable}
                          disabled={!canManage || savingId === item.id}
                          label={`${item.name} in billing`}
                          onClick={() =>
                            updateItem(
                              item,
                              { billable: !item.billable },
                              `${item.name} ${item.billable ? "removed from" : "added to"} billing.`,
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No items match." />
          )}
        </div>
      </Panel>

      {priceEdit && (
        <Modal
          title={priceEdit.item.name}
          onClose={() => setPriceEdit(null)}
          maxWidthClassName="max-w-md"
        >
          <form onSubmit={savePrice} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹, incl. GST)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceEdit.price}
                  onChange={(event) =>
                    setPriceEdit({ ...priceEdit, price: event.target.value })
                  }
                  className={inputClass}
                  autoFocus
                />
              </Field>
              <Field label="GST %">
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={priceEdit.gstRate}
                  onChange={(event) =>
                    setPriceEdit({ ...priceEdit, gstRate: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            {priceEdit.item.showOnWebsite && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This item is also on the website — the new price applies there
                too.
              </p>
            )}
            <ActionButton
              type="submit"
              disabled={savingId === priceEdit.item.id}
            >
              Save
            </ActionButton>
          </form>
        </Modal>
      )}

      {newItem && (
        <Modal
          title="Add shop item"
          onClose={() => setNewItem(null)}
          maxWidthClassName="max-w-md"
        >
          <form onSubmit={createItem} className="grid gap-3">
            <Field
              label="Item name"
              hint="Sold at the counter only — it will not appear on the website."
            >
              <input
                value={newItem.name}
                onChange={(event) =>
                  setNewItem({ ...newItem, name: event.target.value })
                }
                className={inputClass}
                maxLength={120}
                autoFocus
                required
              />
            </Field>
            <Field label="Category" hint="Pick one or type a new category.">
              <input
                value={newItem.category}
                onChange={(event) =>
                  setNewItem({ ...newItem, category: event.target.value })
                }
                list="billing-category-options"
                className={inputClass}
                required
              />
              <datalist id="billing-category-options">
                {categories.map((entry) => (
                  <option key={entry} value={entry} />
                ))}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (₹, incl. GST)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(event) =>
                    setNewItem({ ...newItem, price: event.target.value })
                  }
                  className={inputClass}
                  required
                />
              </Field>
              <Field label="GST %">
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={newItem.gstRate}
                  onChange={(event) =>
                    setNewItem({ ...newItem, gstRate: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            </div>
            <ActionButton type="submit" disabled={savingId === "new"}>
              {savingId === "new" ? "Adding..." : "Add item"}
            </ActionButton>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default BillingItemsPage;
